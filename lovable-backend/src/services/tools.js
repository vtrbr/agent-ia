import fs from 'fs/promises';
import path from 'path';
import { exec, execFile, spawn } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);
const execFileAsync = promisify(execFile);
const WORKSPACE_ROOT = path.join(process.cwd(), 'workspace');
let workspaceDir = WORKSPACE_ROOT;

export function setWorkspace(projectId = 'default') {
    if (!/^[a-zA-Z0-9_-]+$/.test(projectId)) {
        throw new Error('Identificador de projeto inválido.');
    }
    workspaceDir = path.join(WORKSPACE_ROOT, projectId);
    return workspaceDir;
}

export function getWorkspaceDir() {
    return workspaceDir;
}

function safeWorkspacePath(fileName) {
    const root = path.resolve(workspaceDir);
    const target = path.resolve(root, String(fileName));
    if (target !== root && !target.startsWith(`${root}${path.sep}`)) {
        throw new Error('Caminho de arquivo fora do workspace.');
    }
    return target;
}

let activeServerProcess = null;

// Inicializa o diretório de trabalho isolado
export async function initWorkspace(projectId = 'default') {
    setWorkspace(projectId);
    await fs.mkdir(workspaceDir, { recursive: true });
    console.log(`📂 Workspace garantido em: ${workspaceDir}`);
}

// 🛠 FERRAMENTA 1: Criar ou Substituir Arquivo
export async function writeFile(fileName, content) {
    try {
        const filePath = safeWorkspacePath(fileName);
        await fs.mkdir(path.dirname(filePath), { recursive: true });
        await fs.writeFile(filePath, content, 'utf-8');
        return `✅ Arquivo ${fileName} salvo com sucesso.`;
    } catch (error) {
        return `❌ Erro ao salvar ${fileName}: ${error.message}`;
    }
}

// 🛠 FERRAMENTA 2: Ler Arquivo Existente
export async function readFile(fileName) {
    try {
        const filePath = safeWorkspacePath(fileName);
        const content = await fs.readFile(filePath, 'utf-8');
        return content;
    } catch (error) {
        return `❌ Erro ao ler ${fileName}: Arquivo não encontrado ou sem permissão.`;
    }
}

// 🛠 FERRAMENTA 3: Aplicar Alteração Localizada (Edição Incremental / Patch)
export async function editFile(fileName, oldText, newText) {
    try {
        const filePath = safeWorkspacePath(fileName);
        let content = await fs.readFile(filePath, 'utf-8');
        
        if (!content.includes(oldText)) {
            return { 
                success: false, 
                message: `❌ Erro: O trecho antigo não foi encontrado no arquivo ${fileName}.`
            };
        }

        content = content.replace(oldText, newText);
        await fs.writeFile(filePath, content, 'utf-8');
        
        console.log(`📝 Edição incremental aplicada em ${fileName}`);
        return { success: true, message: `✅ Arquivo ${fileName} alterado com sucesso.` };
        
    } catch (error) {
        return { success: false, message: `❌ Erro ao editar ${fileName}: ${error.message}` };
    }
}

// 🛠 FERRAMENTA 4: Remover Arquivo
export async function deleteFile(fileName) {
    try {
        const filePath = safeWorkspacePath(fileName);
        await fs.unlink(filePath);
        return `🗑️ Arquivo ${fileName} removido com sucesso.`;
    } catch (error) {
        return `❌ Erro ao remover ${fileName}: ${error.message}`;
    }
}

// 🛠 FERRAMENTA 5: Listar Estrutura de Arquivos do Projeto
export async function listFiles() {
    try {
        const entries = await fs.readdir(workspaceDir, { recursive: true });
        return entries.filter(e => !e.includes('node_modules') && !e.includes('.git'));
    } catch (error) {
        return [];
    }
}

// 🛠 FERRAMENTA 6: Pesquisar Código, Símbolos ou Funções
export async function searchCode(searchTerm) {
    try {
        const files = await listFiles();
        const results = [];
        
        for (const file of files) {
            const filePath = safeWorkspacePath(file);
            const stats = await fs.stat(filePath);
            if (stats.isFile()) {
                const content = await fs.readFile(filePath, 'utf-8');
                if (content.includes(searchTerm)) {
                    results.push(file);
                }
            }
        }
        return results;
    } catch (error) {
        return [];
    }
}

// 🛠 FERRAMENTA 7: Executar Comando no Terminal (Sandbox)
export async function runCommand(command) {
    try {
        console.log(`\n⚙️ Terminal: ${command}`);
        const { stdout, stderr } = await execAsync(command, { cwd: workspaceDir });
        
        if (stderr && !stderr.toLowerCase().includes('warn')) {
            return { success: false, output: stderr }; 
        }
        return { success: true, output: stdout };
    } catch (error) {
        return { success: false, output: error.message };
    }
}

// 🛠 FERRAMENTA 8: Executar Testes Automatizados
export async function runTests(testCommand = "npm test") {
    try {
        console.log(`🧪 Rodando testes: ${testCommand}`);
        const { stdout, stderr } = await execAsync(testCommand, { cwd: workspaceDir });
        return { success: true, output: stdout || stderr };
    } catch (error) {
        return { success: false, output: error.message };
    }
}

// 🛠 FERRAMENTA 9: Iniciar Servidor de Desenvolvimento
export async function startServer(command = "node index.js") {
    try {
        if (activeServerProcess) {
            console.log("⚠️ Servidor anterior ativo. Parando...");
            await stopServer();
        }

        console.log(`🚀 Iniciando servidor com: ${command}`);
        const [cmd, ...args] = command.split(' ');
        
        activeServerProcess = spawn(cmd, args, { 
            cwd: workspaceDir, 
            shell: true,
            stdio: 'inherit'
        });

        activeServerProcess.on('error', (err) => {
            console.error(`❌ Erro no processo do servidor: ${err.message}`);
        });

        return { success: true, message: `✅ Servidor iniciado com sucesso.` };
    } catch (error) {
        return { success: false, message: `❌ Falha ao iniciar servidor: ${error.message}` };
    }
}

// 🛠 FERRAMENTA 10: Parar Processos do Projeto
export async function stopServer() {
    try {
        if (activeServerProcess) {
            activeServerProcess.kill();
            activeServerProcess = null;
            console.log(`🛑 Servidor parado.`);
            return { success: true, message: `✅ Servidor encerrado.` };
        }
        return { success: true, message: `ℹ️ Nenhum servidor ativo no momento.` };
    } catch (error) {
        return { success: false, message: `❌ Erro ao parar servidor: ${error.message}` };
    }
}

// 🛠 FERRAMENTA 11: Criar Ponto de Restauração (Snapshot Git)
export async function gitSnapshot(commitMessage = "Snapshot automático") {
    try {
        const safeMessage = String(commitMessage || 'Snapshot automático').replace(/[\r\n]/g, ' ').slice(0, 200);
        await execFileAsync('git', ['init'], { cwd: workspaceDir });
        await execFileAsync('git', ['add', '.'], { cwd: workspaceDir });
        await execFileAsync('git', ['commit', '-m', safeMessage], { cwd: workspaceDir });
        console.log(`📸 Snapshot salvo: ${commitMessage}`);
        return true;
    } catch (error) {
        // Ignora caso não existam novas alterações para commitar
        return false;
    }
}

// 🛠 FERRAMENTA 12: Restaurar Estado Anterior (Rollback Git)
export async function listSnapshots() {
    try {
        const { stdout } = await execFileAsync('git', ['log', '--format=%H%x09%aI%x09%s', '-n', '30'], { cwd: workspaceDir });
        return stdout.trim().split('\n').filter(Boolean).map((line) => {
            const [commit, createdAt, ...messageParts] = line.split('\t');
            return { commit, createdAt, message: messageParts.join('\t') };
        });
    } catch {
        return [];
    }
}

export async function gitRollbackTo(commit) {
    const safeCommit = String(commit || '').trim();
    if (!/^[a-f0-9]{7,64}$/i.test(safeCommit)) throw new Error('Commit de rollback inválido.');
    try {
        await execFileAsync('git', ['reset', '--hard', safeCommit], { cwd: workspaceDir });
        return true;
    } catch (error) {
        throw new Error(`Falha no rollback: ${error.message}`);
    }
}

export async function gitRollback() {
    try {
        await execAsync('git reset --hard HEAD~1', { cwd: workspaceDir });
        console.log(`⏪ Rollback executado. Projeto restaurado!`);
        return true;
    } catch (error) {
        console.error(`❌ Falha no Rollback: ${error.message}`);
        return false;
    }
}
