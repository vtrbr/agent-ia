import { 
    initWorkspace, writeFile, readFile, runCommand, 
    gitSnapshot, gitRollback, startServer, stopServer, runTests 
} from './services/tools.js';
import { analyzeRequirements } from './agents/requirementsAnalyzer.js';
import { planProject } from './agents/architect.js';
import { generateCode } from './agents/coder.js';
import { fixCode } from './agents/tester.js';
import { installDependencies } from './agents/dependencyManager.js';
import { auditCode } from './agents/security.js';
import { saveProjectMemory, loadProjectMemory } from './services/memory.js';

async function runLovableEngine(rawIdea, testCommand = "node index.js") {
    try {
        console.log(`\n========================================`);
        console.log(`🤖 LOVABLE 2.0 - MOTOR AUTÔNOMO ATIVO`);
        console.log(`========================================\n`);

        await initWorkspace();

        // 1. Carrega memória anterior se houver (para contexto incremental)
        const memory = await loadProjectMemory();
        console.log(`🧠 Memória do projeto carregada. Iterações anteriores: ${memory.iterations.length}`);

        // 2. Análise de Requisitos
        const requirements = await analyzeRequirements(rawIdea);
        console.log(`📋 Objetivo: ${requirements.objective}`);

        // 3. Planejamento Arquitetural
        const plan = await planProject(JSON.stringify(requirements));

        // 4. Gerenciamento de Dependências (NPM)
        const projectContext = JSON.stringify(requirements);
        await installDependencies(projectContext, plan.files);

        // 5. Geração e Auditoria de Código por Arquivo
        for (const file of plan.files) {
            let code = await generateCode(file.path, file.description, projectContext);
            
            // Auditoria AppSec (Segurança)
            const securityCheck = await auditCode(file.path, code);
            if (securityCheck !== "SEGURO") {
                console.log(`⚠️ Falha de segurança corrigida em ${file.path}`);
                code = securityCheck;
            } else {
                console.log(`✅ ${file.path} aprovado na segurança.`);
            }

            await writeFile(file.path, code);
        }

        console.log(`\n🎉 Estrutura de arquivos gerada e blindada.`);
        await gitSnapshot("Snapshot inicial gerado pela IA");

        // 6. Testes e Self-Healing com Controle de Servidor
        if (testCommand) {
            console.log(`\n🧪 Iniciando ciclo de validação e Self-Healing...`);
            let isFixed = false;
            let attempts = 0;
            const MAX_ATTEMPTS = 3;

            while (!isFixed && attempts < MAX_ATTEMPTS) {
                attempts++;
                
                // Roda os testes ou valida o servidor
                const result = await runTests(testCommand);

                if (result.success && !result.output.includes("ERR")) {
                    console.log(`✅ Validação bem-sucedida na tentativa ${attempts}!`);
                    await gitSnapshot("Snapshot validado e funcional");
                    isFixed = true;
                } else {
                    console.log(`⚠️ Erro detectado (Tentativa ${attempts}/${MAX_ATTEMPTS}). Acionando Testador...`);
                    
                    const targetFile = plan.files[0].path; 
                    const currentCode = await readFile(targetFile);
                    const fixedCode = await fixCode(targetFile, currentCode, result.output);
                    
                    await writeFile(targetFile, fixedCode);
                    console.log(`♻️ Código corrigido pelo Testador. Reexecutando...`);
                }
            }

            if (!isFixed) {
                console.log(`❌ Self-Healing esgotou as tentativas. Revertendo para o snapshot seguro...`);
                await gitRollback();
            }
        }

        // 7. Salva o estado atual na memória de longo prazo
        memory.iterations.push({ idea: rawIdea, timestamp: new Date().toISOString() });
        await saveProjectMemory(memory);

        console.log(`\n✨ CICLO DO MOTOR CONCLUÍDO COM SUCESSO! ✨\n`);

    } catch (error) {
        console.error("\n❌ Erro crítico no motor autônomo:", error);
    }
}

// 💥 Ponto de Entrada para Testar o Motor Completo
const userInput = "Crie uma API REST completa de gerenciamento de produtos com rotas CRUD usando Express";
const validationCommand = "node index.js"; 

runLovableEngine(userInput, validationCommand);
