import fs from 'fs/promises';
import path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);
const WORKSPACE_DIR = path.join(process.cwd(), 'workspace');

export async function initWorkspace() {
    await fs.mkdir(WORKSPACE_DIR, { recursive: true });
    console.log(`📂 Workspace garantido em: ${WORKSPACE_DIR}`);
}

export async function writeFile(fileName, content) {
    try {
        const filePath = path.join(WORKSPACE_DIR, fileName);
        await fs.mkdir(path.dirname(filePath), { recursive: true });
        await fs.writeFile(filePath, content, 'utf-8');
        return `✅ Arquivo ${fileName} salvo com sucesso.`;
    } catch (error) {
        return `❌ Erro ao salvar ${fileName}: ${error.message}`;
    }
}

export async function readFile(fileName) {
    try {
        const filePath = path.join(WORKSPACE_DIR, fileName);
        const content = await fs.readFile(filePath, 'utf-8');
        return content;
    } catch (error) {
        return `❌ Erro ao ler ${fileName}: Arquivo não encontrado ou sem permissão.`;
    }
}

export async function runCommand(command) {
    try {
        console.log(`\n⚙️ Executando: ${command}`);
        const { stdout, stderr } = await execAsync(command, { cwd: WORKSPACE_DIR });
        
        if (stderr) {
            return { success: true, output: stderr }; // Alguns warnings caem aqui
        }
        return { success: true, output: stdout };
    } catch (error) {
        return { success: false, output: error.message };
    }
}
