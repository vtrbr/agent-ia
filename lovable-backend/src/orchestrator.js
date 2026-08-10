import { 
    initWorkspace, writeFile, readFile, runCommand, 
    gitSnapshot, gitRollback, runTests 
} from './services/tools.js';
import { analyzeRequirements } from './agents/requirementsAnalyzer.js';
import { specifyUIUX } from './agents/uiux.js';
import { specifyDatabase } from './agents/database.js';
import { planProject } from './agents/architect.js';
import { generateCode } from './agents/coder.js';
import { fixCode } from './agents/tester.js';
import { installDependencies } from './agents/dependencyManager.js';
import { auditCode } from './agents/security.js';
import { saveProjectMemory, loadProjectMemory } from './services/memory.js';

async function runLovableEngine(rawIdea, testCommand = "node index.js") {
    try {
        console.log(`\n========================================`);
        console.log(`🤖 LOVABLE 2.0 - PIPELINE MULTIAGENTE ATIVO`);
        console.log(`========================================\n`);

        await initWorkspace();

        // 1. Memória
        const memory = await loadProjectMemory();

        // 2. Análise de Requisitos
        const requirements = await analyzeRequirements(rawIdea);
        console.log(`📋 Objetivo: ${requirements.objective}`);

        // 3. Especificações de UI/UX e Banco de Dados (Novos Agentes)
        const uiuxSpec = await specifyUIUX(requirements);
        const dbSpec = await specifyDatabase(requirements);
        
        const enrichedContext = {
            requirements,
            uiuxSpec,
            dbSpec
        };
        const contextString = JSON.stringify(enrichedContext);

        // 4. Arquiteto planeja considerando UI/UX e Banco
        const plan = await planProject(contextString);

        // 5. Gerenciamento de Dependências
        await installDependencies(contextString, plan.files);

        // 6. Geração e Auditoria de Segurança por Arquivo
        for (const file of plan.files) {
            let code = await generateCode(file.path, file.description, contextString);
            
            // Segurança (AppSec)
            const securityCheck = await auditCode(file.path, code);
            if (securityCheck !== "SEGURO") {
                console.log(`⚠️ Falha de segurança neutralizada em ${file.path}`);
                code = securityCheck;
            } else {
                console.log(`✅ ${file.path} aprovado na auditoria.`);
            }

            await writeFile(file.path, code);
        }

        console.log(`\n🎉 Arquivos gerados, blindados e salvos.`);
        await gitSnapshot("Snapshot inicial gerado pela IA");

        // 7. Testes e Self-Healing Automático
        if (testCommand) {
            console.log(`\n🧪 Iniciando validação e Self-Healing...`);
            let isFixed = false;
            let attempts = 0;
            const MAX_ATTEMPTS = 3;

            while (!isFixed && attempts < MAX_ATTEMPTS) {
                attempts++;
                const result = await runTests(testCommand);

                if (result.success && !result.output.includes("ERR")) {
                    console.log(`✅ Testes e execução validados com sucesso!`);
                    await gitSnapshot("Snapshot final validado");
                    isFixed = true;
                } else {
                    console.log(`⚠️ Falha detectada (Tentativa ${attempts}/${MAX_ATTEMPTS}). Acionando Testador...`);
                    
                    const targetFile = plan.files[0].path; 
                    const currentCode = await readFile(targetFile);
                    const fixedCode = await fixCode(targetFile, currentCode, result.output);
                    
                    await writeFile(targetFile, fixedCode);
                    console.log(`♻️ Código corrigido. Reexecutando...`);
                }
            }

            if (!isFixed) {
                console.log(`❌ Limite de tentativas atingido. Revertendo para o snapshot seguro...`);
                await gitRollback();
            }
        }

        // 8. Salva histórico na memória
        memory.iterations.push({ idea: rawIdea, timestamp: new Date().toISOString() });
        await saveProjectMemory(memory);

        console.log(`\n✨ CICLO COMPLETO CONCLUÍDO COM SUCESSO! ✨\n`);

    } catch (error) {
        console.error("\n❌ Erro crítico no motor autônomo:", error);
    }
}

// 💥 Ponto de Entrada do Sistema
const userInput = "Crie uma aplicação fullstack simples de notas com backend em Node.js e banco SQLite";
const validationCommand = "node index.js"; 

runLovableEngine(userInput, validationCommand);
