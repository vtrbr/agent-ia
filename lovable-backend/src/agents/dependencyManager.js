import { callAI } from '../services/puterService.js';
import { runCommand } from '../services/tools.js';

export async function installDependencies(projectContext, filesPlan) {
    const systemPrompt = `Você é um Gerente de Dependências (DevOps).
    Sua única função é analisar um projeto e listar QUAIS pacotes NPM precisam ser instalados.
    
    REGRAS OBRIGATÓRIAS:
    1. Responda APENAS com um JSON contendo um array de strings (nomes dos pacotes).
    2. NÃO use formatação markdown (como \`\`\`json).
    3. Se o projeto não precisar de pacotes externos, retorne um array vazio: []
    
    EXEMPLO DE RESPOSTA ESPERADA:
    ["express", "cors", "dotenv"]`;

    const userPrompt = `Contexto do Projeto: ${projectContext}
    Arquivos planejados pelo Arquiteto: ${JSON.stringify(filesPlan)}
    
    Quais pacotes npm devo instalar?`;

    console.log(`\n📦 Gerente de Dependências: Analisando bibliotecas necessárias...`);
    
    const rawResponse = await callAI(systemPrompt, userPrompt, 'openai/gpt-4o-mini');
    
    try {
        const cleanJson = rawResponse.replace(/```json/gi, '').replace(/```/gi, '').trim();
        const packages = JSON.parse(cleanJson);
        
        if (packages.length > 0) {
            console.log(`📥 Instalando pacotes: ${packages.join(', ')}`);
            // Inicia um package.json zerado no workspace se não existir
            await runCommand('npm init -y'); 
            
            // Instala os pacotes
            const result = await runCommand(`npm install ${packages.join(' ')}`);
            if (result.success) {
                console.log(`✅ Dependências instaladas com sucesso!`);
            } else {
                console.error(`❌ Erro ao instalar pacotes: ${result.output}`);
            }
        } else {
            console.log(`✅ Nenhuma dependência externa necessária para este projeto.`);
        }
    } catch (error) {
        console.error("❌ O Gerente de Dependências falhou ao processar a lista.", error);
    }
}
