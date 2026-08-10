import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { randomUUID } from 'crypto';
import { runLovableEngine } from './orchestrator.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const jobs = new Map();
app.use(express.json());
app.use(cors());

// Servir a interface estática da pasta public (que vamos criar a seguir)
app.use(express.static(path.join(__dirname, '../../public')));

// Rota principal onde o Chat vai enviar o comando do usuário
app.post('/api/build', async (req, res) => {
    const { prompt } = req.body;
    
    if (!prompt) {
        return res.status(400).json({ error: 'O prompt do projeto é obrigatório.' });
    }

    try {
        console.log(`\n📥 [API Gateway] Nova solicitação recebida: "${prompt}"`);
        
        const jobId = randomUUID();
        jobs.set(jobId, { id: jobId, prompt, status: 'queued', createdAt: new Date().toISOString() });
        res.status(202).json({ success: true, jobId, status: 'queued' });

        setImmediate(async () => {
            const job = jobs.get(jobId);
            if (!job) return;
            job.status = 'running';
            job.startedAt = new Date().toISOString();
            try {
                await runLovableEngine(prompt);
                job.status = 'completed';
                job.completedAt = new Date().toISOString();
            } catch (error) {
                job.status = 'failed';
                job.error = error.message;
                console.error(`❌ [Job ${jobId}]`, error);
            }
        });

    } catch (error) {
        console.error("❌ Erro na API de build:", error);
        res.status(500).json({ success: false, error: error.message });
    }
});

app.get('/api/build/:jobId', (req, res) => {
    const job = jobs.get(req.params.jobId);
    if (!job) return res.status(404).json({ error: 'Job não encontrado.' });
    res.json(job);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🌐 Servidor da Plataforma rodando em: http://localhost:${PORT}`);
});
