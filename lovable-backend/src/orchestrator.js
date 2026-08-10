import { initWorkspace, writeFile, readFile, runCommand, gitSnapshot, gitRollback } from './services/tools.js';
import { planProject } from './agents/architect.js';
import { generateCode } from './agents/coder.js';
import { fixCode } from './agents/tester.js';
import { installDependencies } from './agents/dependencyManager.js';

async function runProject(idea, testCommand = '') {
    try {
        console.log(`\n🚀 INICIANDO LOVABLE 2.0: "${idea}"`);
        await initWorkspace();

        // 1. Arquiteto planeja
        const plan = await planProject(idea);

        // 2. 🆕 Gerente de Dependências analisa e instala
        await installDependencies(idea, plan.files);

        // 3. Programador escreve os arquivos
        for (const file of plan.files) {
            const code = await generateCode(file.path, file.description, idea);
            await writeFile(file.path, code);
        }

        console.log(`\n🎉 Código gerado!`);

        // 4. 🆕 Cria o Snapshot de segurança (O código gerado cru, antes dos testes)
        await gitSnapshot("Código inicial gerado pela IA");

        // 5. Teste e Self-Healing
        if (testCommand) {
            console.log(`\n🧪 Iniciando testes automáticos...`);
            let isFixed = false;
            let attempts = 0;
            const MAX_ATTEMPTS = 3;

            while (!isFixed && attempts < MAX_ATTEMPTS) {
                attempts++;
                const result = await runCommand(testCommand);

                if (result.success) {
                    console.log(`✅ Teste passou na tentativa ${attempts}!\nOutput:\n${result.output}`);
                    // Salva o snapshot final do código funcional
                    await gitSnapshot("Código validado e funcional");
                    isFixed = true;
                } else {
                    console.log(`⚠️ Erro detectado (Tentativa ${attempts}/${MAX_ATTEMPTS}). Acionando Testador...`);
                    
                    const targetFile = plan.files[0].path; 
                    const currentCode = await readFile(targetFile);
                    const fixedCode = await fixCode(targetFile, currentCode, result.output);
                    
                    await writeFile(targetFile, fixedCode);
                    console.log(`♻️ Código reescrito. Testando novamente...`);
                }
            }

            // 6. 🆕 Rollback se o Self-Healing não der conta
            if (!isFixed) {
                console.log(`❌ Testador esgotou as tentativas de correção.`);
                console.log(`🔄 Restaurando projeto para a versão inicial do snapshot...`);
                await gitRollback();
            }
        }

    } catch (error) {
        console.error("\n❌ Fluxo interrompido:", error);
    }
}

// 💥 Ponto de Entrada
const userInput = "Crie uma API REST simples em Node.js com Express que retorne 'Sistema Operacional da IA rodando!' na rota /status";
const validationCommand = "node index.js"; 

runProject(userInput, validationCommand);
