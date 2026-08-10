import fs from 'fs/promises';
import path from 'path';

const MEMORY_ROOT = path.join(process.cwd(), 'workspace');

function memoryFile(projectId = 'default') {
    if (!/^[a-zA-Z0-9_-]+$/.test(projectId)) throw new Error('Identificador de projeto inválido.');
    return path.join(MEMORY_ROOT, projectId, '.lovable_memory.json');
}

export async function saveProjectMemory(historyData, projectId = 'default') {
    try {
        await fs.mkdir(path.dirname(memoryFile(projectId)), { recursive: true });
        await fs.writeFile(memoryFile(projectId), JSON.stringify(historyData, null, 2), 'utf-8');
    } catch (error) {
        // Workspace pode não ter sido criado ainda
    }
}

export async function loadProjectMemory(projectId = 'default') {
    try {
        const data = await fs.readFile(memoryFile(projectId), 'utf-8');
        return JSON.parse(data);
    } catch (error) {
        return { iterations: [], currentFiles: [] };
    }
}
