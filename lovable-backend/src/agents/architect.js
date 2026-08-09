import { callAI } from '../services/puterService.js';

export async function planProject(projectDescription) {
    const systemPrompt = `Você é um Arquiteto de Software Senior.
    Sua única função é receber uma ideia de projeto e planejar a estrutura de arquivos necessária.
    
    REGRAS OBRIGATÓRIAS E RESTRITAS:
    1. Responda EXCLUSIVAMENTE com um objeto JSON válido.
    2. NÃO inclua nenhum texto antes ou depois do JSON.
    3. NÃO utilize formatação Markdown (como \`\`\`json).
    
    ESTRUTURA ESPERADA DO JSON:
    {
      "projectName": "nome-curto-do-projeto",
      "files": [
        {
          "path": "caminho/do/arquivo.ext",
          "description": "Explicação detalhada do que o Programador deve escrever neste arquivo"
        }
      ]
    }`;

    const userPrompt = `Crie a arquitetura para o seguinte projeto: "${projectDescription}"`;

    console.log(`\n🧠 Arquiteto: Desenhando a estrutura para "${projectDescription}"...`);
    
    const rawResponse = await callAI(systemPrompt, userPrompt, 'openai/gpt-4o-mini');
    
    try {
        const cleanJson = rawResponse.replace(/```json/gi, '').replace(/```/gi, '').trim();
        const plan = JSON.parse(cleanJson);
        console.log(`✅ Arquiteto: Plano criado com ${plan.files.length} arquivos.`);
        return plan;
    } catch (error) {
        console.error("❌ Arquiteto falhou ao gerar um JSON estruturado.", rawResponse);
        throw new Error("Falha no parse do JSON do Arquiteto.");
    }
}
