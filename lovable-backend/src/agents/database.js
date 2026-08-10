import { callAI } from '../services/puterService.js';
import { getBestModelForTask } from '../services/modelRouter.js';

export async function specifyDatabase(requirements) {
    const systemPrompt = `Você é um Arquiteto de Banco de Dados Sênior.
    Sua missão é projetar o esquema de dados (tabelas, collections ou modelos) necessários para o projeto.
    
    REGRAS OBRIGATÓRIAS:
    1. Responda EXCLUSIVAMENTE com um JSON válido.
    2. NÃO use formatação markdown (como \`\`\`json).
    
    ESTRUTURA ESPERADA DO JSON:
    {
      "databaseType": "PostgreSQL / MongoDB / SQLite / Memory",
      "entities": [
        {
          "name": "NomeEntidade",
          "fields": ["campo1: tipo", "campo2: tipo"]
        }
      ]
    }`;

    const userPrompt = `Requisitos do projeto: ${JSON.stringify(requirements)}`;
    console.log(`🗄️ Banco de Dados: Projetando esquemas de persistência...`);

    const model = getBestModelForTask('planning');
    const rawResponse = await callAI(systemPrompt, userPrompt, model);

    try {
        const cleanJson = rawResponse.replace(/```json/gi, '').replace(/```/gi, '').trim();
        return JSON.parse(cleanJson);
    } catch (error) {
        return { databaseType: "Nenhum", entities: [] };
    }
}
