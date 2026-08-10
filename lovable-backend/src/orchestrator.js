import { 
    initWorkspace, writeFile, readFile, listFiles, runCommand,
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
import { validatePlan } from './services/artifactValidator.js';

// ✅ ADICIONADO O "export" AQUI PARA O SERVER.JS ENCONTRAR
export async function runLovableEngine(rawIdea, testCommand = "node index.js", projectId = 'default', report = () => {}, options = {}) {
    try {
        console.log(`\n========================================`);
        console.log(`🤖 LOVABLE 2.0 - PIPELINE MULTIAGENTE ATIVO`);
        console.log(`========================================\n`);

        await initWorkspace(projectId);
        const mode = options.mode === 'incremental' ? 'incremental' : 'initial';
        report('pipeline.workspace.ready', { projectId, mode });

        // 1. Memória e contexto dos artefatos existentes
        const memory = await loadProjectMemory(projectId);
        const existingPaths = mode === 'incremental' ? await listFiles() : [];
        const existingFiles = {};
        for (const filePath of existingPaths.slice(0, 80)) {
            const content = await readFile(filePath);
            if (typeof content === 'string' && !content.startsWith('❌')) existingFiles[filePath] = content.slice(0, 12000);
        }

        // 2. Análise de Requisitos
        const requirementsPrompt = mode === 'incremental'
            ? JSON.stringify({ changeRequest: rawIdea, existingFiles, memory: memory.iterations.slice(-5) })
            : rawIdea;
        const requirements = await analyzeRequirements(requirementsPrompt);
        report('agent.requirements.completed', { requirements });
        console.log(`📋 Objetivo: ${requirements.objective}`);

        // 3. Especificações de UI/UX e Banco de Dados
        const uiuxSpec = await specifyUIUX(requirements);
        report('agent.uiux.completed');
        const dbSpec = await specifyDatabase(requirements);
        report('agent.database.completed');
        
        const enrichedContext = {
            mode,
            requirements,
            uiuxSpec,
            dbSpec,
            existingFiles
        };
        const contextString = JSON.stringify(enrichedContext);

        // 4. Arquiteto planeja considerando UI/UX e Banco
        const rawPlan = await planProject(contextString);
        const plan = validatePlan(rawPlan);
        report('agent.architect.completed', { files: plan.files.map((file) => file.path) });

        // 5. Gerenciamento de Dependências
        await installDependencies(contextString, plan.files);
        report('agent.dependencies.completed');

        // 6. Geração e Auditoria de Segurança por Arquivo
        for (const file of plan.files) {
            report('agent.coder.started', { path: file.path });
            let code = await generateCode(file.path, file.description, contextString);
            
            // Segurança (AppSec)
            const securityCheck = await auditCode(file.path, code);
            const normalizedSecurityCheck = String(securityCheck).trim().replace(/^['"]|['"]$/g, '');
            report('agent.security.completed', { path: file.path, changed: normalizedSecurityCheck !== 'SEGURO' });
            if (normalizedSecurityCheck !== "SEGURO") {
                console.log(`⚠️ Falha de segurança neutralizada em ${file.path}`);
                code = securityCheck;
            } else {
                console.log(`✅ ${file.path} aprovado na auditoria.`);
            }

            await writeFile(file.path, code);
            report('agent.file.generated', { path: file.path });
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
                report('agent.tester.started', { attempt: attempts, maxAttempts: MAX_ATTEMPTS });
                const result = await runTests(testCommand);
                report('agent.tester.completed', { attempt: attempts, success: result.success });

                if (result.success && !result.output.includes("ERR")) {
                    console.log(`✅ Testes e execução validados com sucesso!`);
                    await gitSnapshot("Snapshot final validado");
                    isFixed = true;
                } else {
                    console.log(`⚠️ Falha detectada (Tentativa ${attempts}/${MAX_ATTEMPTS}). Acionando Testador...`);
                    
                    const targetFile = plan.files[0].path; 
                    const currentCode = await readFile(targetFile);
                    const fixedCode = await fixCode(targetFile, currentCode, result.output);
                    report('agent.self_healing.applied', { path: targetFile, attempt: attempts });
                    
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
        memory.iterations.push({ idea: rawIdea, mode, timestamp: new Date().toISOString(), projectId });
        await saveProjectMemory(memory, projectId);

        console.log(`\n✨ CICLO COMPLETO CONCLUÍDO COM SUCESSO! ✨\n`);
        return { success: true, mode, requirements, plan };

    } catch (error) {
        console.error("\n❌ Erro crítico no motor autônomo:", error);
        throw error;
    }
}
