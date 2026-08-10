import { initWorkspace, writeFile, readFile, runCommand, gitSnapshot, gitRollback } from './services/tools.js';
import { analyzeRequirements } from './agents/requirementsAnalyzer.js'; // 🆕 Novo agente na ponta
import { planProject } from './agents/architect.js';
import { generateCode } from './agents/coder.js';
import { fixCode } from './agents/tester.js';
import { installDependencies } from './agents/dependencyManager.js';
import { auditCode } from './agents/security.js';

async function runProject(rawIdea, testCommand = '') {
    try {
        console.log(`\n🚀 INICIANDO LOVABLE 2.0 (Pipeline Completo)`);
        await initWorkspace();

        // 1. 🆕 Analisa e expande os requisitos do usuário
        const requirements = await analyzeRequirements(rawIdea);
        console.log(`💡 Objetivo estruturado: ${requirements.objective}`);

        // 2. Arquiteto planeja com base nos requisitos detalhados
        const plan = await planProject(JSON.stringify(requirements));

        // 3. Gerente de Dependências instala pacotes necessários
        const projectContext = JSON.stringify(requirements);
        await installDependencies(projectContext, plan.files);

        // 4. Programador escreve e Segurança audita cada arquivo
        for (const file of plan.files) {
            let code = await generateCode(file.path, file.description, projectContext);
            
            // Auditoria AppSec
            const securityCheck = await auditCode(file.path, code);
            if (securityCheck !== "SEGURO") {
                console.log(`⚠️ Falha de segurança em ${file.path}. Aplicando correção blindada.`);
                code = securityCheck;
            } else {
                console.log(`✅ ${file.path} aprovado na segurança.`);
            }

            await writeFile(file.path, code);
        }

        console.log(`\n🎉 Todos os arquivos foram gerados e auditados.`);
        await gitSnapshot("Snapshot inicial estruturado");

        // 5. Testes e Self-Healing Automático
        if (testCommand) {
            console.log(`\n🧪 Executando validação de testes...`);
            let isFixed = false;
            let attempts = 0;
            const MAX_ATTEMPTS = 3;

            while (!isFixed && attempts < MAX_ATTEMPTS) {
                attempts++;
                const result = await runCommand(testCommand);

                if (result.success) {
                    console.log(`✅ Testes aprovados na tentativa ${attempts}!\nOutput:\n${result.output}`);
                    await gitSnapshot("Snapshot final validado");
                    isFixed = true;
                } else {
                    console.log(`⚠️ Erro capturado (Tentativa ${attempts}/${MAX_ATTEMPTS}). Acionando Testador...`);
                    
                    const targetFile = plan.files[0].path; 
                    const currentCode = await readFile(targetFile);
                    const fixedCode = await fixCode(targetFile, currentCode, result.output);
                    
                    await writeFile(targetFile, fixedCode);
                    console.log(`♻️ Código corrigido. Reexecutando testes...`);
                }
            }

            if (!isFixed) {
                console.log(`❌ Limite de correções atingido. Revertendo para o snapshot seguro...`);
                await gitRollback();
            }
        }

    } catch (error) {
        console.error("\n❌ Erro crítico no fluxo principal:", error);
    }
}

// 💥 Ponto de Entrada do Sistema
const userInput = "Crie um sistema simples de gerenciamento de tarefas (Todo List) em Node.js usando Express";
const validationCommand = "node index.js"; 

runProject(userInput, validationCommand);
