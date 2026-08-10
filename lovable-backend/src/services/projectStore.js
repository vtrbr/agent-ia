import fs from 'fs/promises';
import path from 'path';
import { randomUUID } from 'crypto';

const DATA_DIR = path.join(process.cwd(), 'data');
const PROJECTS_FILE = path.join(DATA_DIR, 'projects.json');

async function readProjects() {
    try {
        return JSON.parse(await fs.readFile(PROJECTS_FILE, 'utf8'));
    } catch {
        return [];
    }
}

async function writeProjects(projects) {
    await fs.mkdir(DATA_DIR, { recursive: true });
    await fs.writeFile(PROJECTS_FILE, JSON.stringify(projects, null, 2), 'utf8');
}

export async function listProjects() {
    return readProjects();
}

export async function getProject(projectId) {
    return (await readProjects()).find((project) => project.id === projectId) || null;
}

export async function createProject({ name, prompt = '' }) {
    const projects = await readProjects();
    const now = new Date().toISOString();
    const project = {
        id: randomUUID(),
        name: String(name || 'Novo projeto').trim().slice(0, 120),
        prompt: String(prompt || '').trim(),
        createdAt: now,
        updatedAt: now,
        lastJobId: null,
    };
    projects.push(project);
    await writeProjects(projects);
    return project;
}

export async function updateProject(projectId, patch) {
    const projects = await readProjects();
    const index = projects.findIndex((project) => project.id === projectId);
    if (index < 0) return null;
    projects[index] = { ...projects[index], ...patch, id: projectId, updatedAt: new Date().toISOString() };
    await writeProjects(projects);
    return projects[index];
}
