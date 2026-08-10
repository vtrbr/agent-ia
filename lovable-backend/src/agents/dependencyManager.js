import { callAI } from '../services/puterService.js';
import { runCommand } from '../services/tools.js';
import { getBestModelForTask } from '../services/modelRouter.js';

export async function installDependencies(projectContext, filesPlan) {
    const systemPrompt = `Você é um Gerente de Dependências (DevOps).
    Analise o projeto e liste QUAIS pacotes NPM instalar.
    
    REGRAS OBRIGATÓRIAS:
    1. Responda APENAS com um JSON contendo um array de strings.
    2. NÃO use formatação markdown.
    3. Se não precisar, retorne: []`;

    const userPrompt = `Contexto: ${projectContext}
    Arquivos: ${JSON.stringify(filesPlan)}
    Quais pacotes npm devo instalar?`;

    console.log(`\n📦 Gerente de Dependências: Analisando pacotes...`);
    
    const model = getBestModelForTask('dependencies');
    const rawResponse = await callAI(systemPrompt, userPrompt, model);
    
    try {
        const cleanJson = rawResponse.replace(/```json/gi, '').replace(/```/gi, '').trim();
        const packages = JSON.parse(cleanJson);
        
        if (packages.length > 0) {
            console.log(`📥 Instalando: ${packages.join(', ')}`);
            await runCommand('npm init -y'); 
            await runCommand(`npm install ${packages.join(' ')}`);
            console.log(`✅ Dependências instaladas!`);
        }
    } catch (error) {
        console.error("❌ O Gerente de Dependências falhou.", error);
    }
}
