import fs from 'fs/promises';
import path from 'path';

const MEMORY_FILE = path.join(process.cwd(), 'workspace', '.lovable_memory.json');

export async function saveProjectMemory(historyData) {
    try {
        await fs.writeFile(MEMORY_FILE, JSON.stringify(historyData, null, 2), 'utf-8');
    } catch (error) {
        // Workspace pode não ter sido criado ainda
    }
}

export async function loadProjectMemory() {
    try {
        const data = await fs.readFile(MEMORY_FILE, 'utf-8');
        return JSON.parse(data);
    } catch (error) {
        return { iterations: [], currentFiles: [] };
    }
}
