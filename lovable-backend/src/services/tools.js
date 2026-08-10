import fs from 'fs/promises';
import path from 'path';
import { exec, spawn } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);
const WORKSPACE_DIR = path.join(process.cwd(), 'workspace');

let activeServerProcess = null;

// Inicializa o diretório de trabalho isolado
export async function initWorkspace() {
    await fs.mkdir(WORKSPACE_DIR, { recursive: true });
    console.log(`📂 Workspace garantido em: ${WORKSPACE_DIR}`);
}

// 🛠 FERRAMENTA 1: Criar ou Substituir Arquivo
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

// 🛠 FERRAMENTA 2: Ler Arquivo Existente
export async function readFile(fileName) {
    try {
        const filePath = path.join(WORKSPACE_DIR, fileName);
        const content = await fs.readFile(filePath, 'utf-8');
        return content;
    } catch (error) {
        return `❌ Erro ao ler ${fileName}: Arquivo não encontrado ou sem permissão.`;
    }
}

// 🛠 FERRAMENTA 3: Aplicar Alteração Localizada (Edição Incremental / Patch)
export async function editFile(fileName, oldText, newText) {
    try {
        const filePath = path.join(WORKSPACE_DIR, fileName);
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
        const filePath = path.join(WORKSPACE_DIR, fileName);
        await fs.unlink(filePath);
        return `🗑️ Arquivo ${fileName} removido com sucesso.`;
    } catch (error) {
        return `❌ Erro ao remover ${fileName}: ${error.message}`;
    }
}

// 🛠 FERRAMENTA 5: Listar Estrutura de Arquivos do Projeto
export async function listFiles() {
    try {
        const entries = await fs.readdir(WORKSPACE_DIR, { recursive: true });
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
            const filePath = path.join(WORKSPACE_DIR, file);
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
        const { stdout, stderr } = await execAsync(command, { cwd: WORKSPACE_DIR });
        
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
        const { stdout, stderr } = await execAsync(testCommand, { cwd: WORKSPACE_DIR });
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
            cwd: WORKSPACE_DIR, 
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
        await execAsync('git init', { cwd: WORKSPACE_DIR });
        await execAsync('git add .', { cwd: WORKSPACE_DIR });
        await execAsync(`git commit -m "${commitMessage}"`, { cwd: WORKSPACE_DIR });
        console.log(`📸 Snapshot salvo: ${commitMessage}`);
        return true;
    } catch (error) {
        // Ignora caso não existam novas alterações para commitar
        return false;
    }
}

// 🛠 FERRAMENTA 12: Restaurar Estado Anterior (Rollback Git)
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
