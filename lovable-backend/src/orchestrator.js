import { initWorkspace, writeFile, readFile, runCommand } from './services/tools.js';
import { planProject } from './agents/architect.js';
import { generateCode } from './agents/coder.js';
import { fixCode } from './agents/tester.js';

async function runProject(idea, testCommand = '') {
    try {
        console.log(`\n🚀 INICIANDO LOVABLE 2.0: "${idea}"`);
        await initWorkspace();

        // 1. Arquiteto cria o plano
        const plan = await planProject(idea);

        // 2. Programador gera os arquivos
        for (const file of plan.files) {
            const code = await generateCode(file.path, file.description, idea);
            await writeFile(file.path, code);
        }

        console.log(`\n🎉 Fase de geração concluída! Arquivos salvos no workspace.`);

        // 3. Execução e Self-Healing (se houver comando de teste)
        if (testCommand) {
            console.log(`\n🧪 Iniciando testes automáticos...`);
            let isFixed = false;
            let attempts = 0;
            const MAX_ATTEMPTS = 3;

            while (!isFixed && attempts < MAX_ATTEMPTS) {
                attempts++;
                const result = await runCommand(testCommand);

                if (result.success) {
                    console.log(`✅ Teste passou com sucesso na tentativa ${attempts}!\nOutput:\n${result.output}`);
                    isFixed = true;
                } else {
                    console.log(`⚠️ Falha detectada (Tentativa ${attempts}/${MAX_ATTEMPTS}). Acionando Testador...`);
                    
                    // Neste protótipo, assumimos correção no primeiro arquivo do projeto (pode ser expandido)
                    const targetFile = plan.files[0].path; 
                    const currentCode = await readFile(targetFile);
                    
                    const fixedCode = await fixCode(targetFile, currentCode, result.output);
                    await writeFile(targetFile, fixedCode);
                    console.log(`♻️ Código de ${targetFile} reescrito. Testando novamente...`);
                }
            }

            if (!isFixed) {
                console.log(`❌ O Testador não conseguiu corrigir o projeto após ${MAX_ATTEMPTS} tentativas.`);
            }
        }

    } catch (error) {
        console.error("\n❌ Fluxo interrompido por erro crítico:", error);
    }
}

// 💥 Ponto de Entrada (Para rodar, basta executar: node src/orchestrator.js)
const userInput = "Crie uma API REST simples em Node.js com Express que retorne 'Hello World' na rota /";
const validationCommand = "node index.js"; // Comando para testar o código gerado

runProject(userInput, validationCommand);
