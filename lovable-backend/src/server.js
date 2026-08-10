import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { runLovableEngine } from './orchestrator.js';
import { createProject, getProject, listProjects, updateProject } from './services/projectStore.js';
import { enqueueJob, getJob, getQueueStats, listProjectJobs, subscribeJob } from './services/jobQueue.js';
import { getWorkspaceDir, gitRollbackTo, listFiles, listSnapshots, setWorkspace } from './services/tools.js';
import fs from 'fs/promises';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();

const majorNodeVersion = Number(process.versions.node.split('.')[0]);
if (majorNodeVersion < 24) {
    console.warn(`⚠️ Node.js ${process.version} detectado. O Puter.js atual requer Node.js 24+ para chamadas reais.`);
}

app.use(express.json({ limit: '1mb' }));
app.use(cors());
app.use(express.static(path.join(__dirname, '../../public')));

function sanitizeTestCommand(command) {
    const value = String(command || 'node index.js').trim();
    if (value === 'npm test' || value === 'npm run test') return value;
    if (/^node\s+[a-zA-Z0-9_./-]+$/.test(value)) return value;
    throw Object.assign(new Error('Comando de teste não permitido.'), { statusCode: 400 });
}

function requireProject(projectId) {
    return getProject(projectId).then((project) => {
        if (!project) {
            const error = new Error('Projeto não encontrado.');
            error.statusCode = 404;
            throw error;
        }
        return project;
    });
}

async function enqueueBuild(project, prompt, testCommand, mode = 'initial') {
    const job = enqueueJob({
        projectId: project.id,
        prompt,
        worker: ({ report }) => runLovableEngine(prompt, sanitizeTestCommand(testCommand), project.id, report, { mode }),
    });
    await updateProject(project.id, { prompt, lastJobId: job.id });
    return job;
}

app.get('/api/health', (req, res) => {
    const aiConfigured = Boolean(process.env.PUTER_AUTH_TOKEN || process.env.PUTER_TOKEN);
    res.json({
        ok: true,
        service: 'agent-ia',
        version: '3.1.0',
        node: process.version,
        runtimeSupported: Number(process.versions.node.split('.')[0]) >= 24,
        aiConfigured,
        queue: getQueueStats(),
    });
});

app.get('/api/projects', async (req, res, next) => {
    try {
        res.json({ projects: await listProjects() });
    } catch (error) {
        next(error);
    }
});

app.post('/api/projects', async (req, res, next) => {
    try {
        const { name, prompt = '' } = req.body || {};
        if (!name || typeof name !== 'string') return res.status(400).json({ error: 'O nome do projeto é obrigatório.' });
        const project = await createProject({ name, prompt });
        res.status(201).json(project);
    } catch (error) {
        next(error);
    }
});

app.get('/api/projects/:projectId', async (req, res, next) => {
    try {
        const project = await requireProject(req.params.projectId);
        res.json({ ...project, jobs: listProjectJobs(project.id) });
    } catch (error) {
        next(error);
    }
});

app.post('/api/projects/:projectId/build', async (req, res, next) => {
    try {
        const project = await requireProject(req.params.projectId);
        const prompt = String(req.body?.prompt || project.prompt || '').trim();
        if (!prompt) return res.status(400).json({ error: 'O prompt do projeto é obrigatório.' });
        const job = await enqueueBuild(project, prompt, req.body?.testCommand || 'node index.js');
        res.status(202).json({ success: true, projectId: project.id, jobId: job.id, status: job.status });
    } catch (error) {
        next(error);
    }
});

// Compatibilidade com o cliente original: cria projeto e inicia o build em uma única chamada.
app.post('/api/projects/:projectId/iterate', async (req, res, next) => {
    try {
        const project = await requireProject(req.params.projectId);
        const prompt = String(req.body?.prompt || '').trim();
        if (!prompt) return res.status(400).json({ error: 'A solicitação de alteração é obrigatória.' });
        const job = await enqueueBuild(project, prompt, req.body?.testCommand || 'node index.js', 'incremental');
        res.status(202).json({ success: true, projectId: project.id, jobId: job.id, mode: 'incremental', status: job.status });
    } catch (error) {
        next(error);
    }
});

app.post('/api/build', async (req, res, next) => {
    try {
        const prompt = String(req.body?.prompt || '').trim();
        if (!prompt) return res.status(400).json({ error: 'O prompt do projeto é obrigatório.' });
        const project = await createProject({ name: prompt.slice(0, 60), prompt });
        const job = await enqueueBuild(project, prompt, req.body?.testCommand || 'node index.js');
        res.status(202).json({ success: true, projectId: project.id, jobId: job.id, status: job.status });
    } catch (error) {
        next(error);
    }
});

app.get('/api/projects/:projectId/jobs', async (req, res, next) => {
    try {
        const project = await requireProject(req.params.projectId);
        res.json({ jobs: listProjectJobs(project.id) });
    } catch (error) {
        next(error);
    }
});

app.get('/api/build/:jobId', (req, res) => {
    const job = getJob(req.params.jobId);
    if (!job) return res.status(404).json({ error: 'Job não encontrado.' });
    res.json(job);
});

app.get('/api/build/:jobId/events', (req, res) => {
    const job = getJob(req.params.jobId);
    if (!job) return res.status(404).json({ error: 'Job não encontrado.' });
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();
    for (const event of job.events) res.write(`id: ${event.id}\nevent: ${event.event}\ndata: ${JSON.stringify(event.data)}\n\n`);
    if (['completed', 'failed'].includes(job.status)) return res.end();
    const unsubscribe = subscribeJob(job.id, (event) => {
        res.write(`id: ${event.id}\nevent: ${event.event}\ndata: ${JSON.stringify(event.data)}\n\n`);
        if (['job.completed', 'job.failed'].includes(event.event)) res.end();
    });
    req.on('close', unsubscribe);
});

app.get('/api/projects/:projectId/versions', async (req, res, next) => {
    try {
        const project = await requireProject(req.params.projectId);
        setWorkspace(project.id);
        res.json({ projectId: project.id, versions: await listSnapshots() });
    } catch (error) {
        next(error);
    }
});

app.post('/api/projects/:projectId/rollback', async (req, res, next) => {
    try {
        const project = await requireProject(req.params.projectId);
        setWorkspace(project.id);
        await gitRollbackTo(req.body?.commit);
        res.json({ success: true, projectId: project.id, commit: req.body.commit });
    } catch (error) {
        next(error);
    }
});

app.get('/api/projects/:projectId/files', async (req, res, next) => {
    try {
        const project = await requireProject(req.params.projectId);
        setWorkspace(project.id);
        res.json({ projectId: project.id, files: await listFiles() });
    } catch (error) {
        next(error);
    }
});

app.get('/api/projects/:projectId/files/*', async (req, res, next) => {
    try {
        const project = await requireProject(req.params.projectId);
        setWorkspace(project.id);
        const relativePath = req.params[0];
        const root = path.resolve(getWorkspaceDir());
        const filePath = path.resolve(root, relativePath);
        if (!filePath.startsWith(`${root}${path.sep}`)) return res.status(400).json({ error: 'Caminho inválido.' });
        res.type(path.extname(filePath) || 'text/plain').send(await fs.readFile(filePath, 'utf8'));
    } catch (error) {
        next(error);
    }
});

app.use((error, req, res, next) => {
    console.error('❌ API error:', error);
    res.status(error.statusCode || 500).json({ error: error.message || 'Erro interno.' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🌐 Agent-IA Platform rodando em http://localhost:${PORT}`));
