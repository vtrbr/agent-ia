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
        return `✅ Arquivo ${fileName} salvo.`;
    } catch (error) {
        return `❌ Erro ao salvar ${fileName}: ${error.message}`;
    }
}

export async function readFile(fileName) {
    try {
        const filePath = path.join(WORKSPACE_DIR, fileName);
        return await fs.readFile(filePath, 'utf-8');
    } catch (error) {
        return `❌ Erro ao ler ${fileName}.`;
    }
}

export async function runCommand(command) {
    try {
        console.log(`\n⚙️ Terminal: ${command}`);
        const { stdout, stderr } = await execAsync(command, { cwd: WORKSPACE_DIR });
        if (stderr && !stderr.toLowerCase().includes('warn')) {
            return { success: false, output: stderr }; 
        }
        return { success: true, output: stdout };
    } catch (error) {
        return { success: false, output: error.message };
    }
}

// 🆕 NOVO: Cria um ponto de restauração usando Git
export async function gitSnapshot(commitMessage = "Snapshot automático") {
    try {
        await execAsync('git init', { cwd: WORKSPACE_DIR });
        await execAsync('git add .', { cwd: WORKSPACE_DIR });
        await execAsync(`git commit -m "${commitMessage}"`, { cwd: WORKSPACE_DIR });
        console.log(`📸 Snapshot salvo: ${commitMessage}`);
        return true;
    } catch (error) {
        // Ignora erros se não houver mudanças para commitar
        return false;
    }
}

// 🆕 NOVO: Desfaz tudo até o último snapshot
export async function gitRollback() {
    try {
        await execAsync('git reset --hard HEAD~1', { cwd: WORKSPACE_DIR });
        console.log(`⏪ Rollback executado. Projeto restaurado!`);
        return true;
    } catch (error) {
        console.error(`❌ Falha no Rollback: ${error.message}`);
        return false;
    }
}
