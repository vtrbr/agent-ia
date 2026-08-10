import { callAI } from '../services/puterService.js';
import { getBestModelForTask } from '../services/modelRouter.js';

export async function analyzeRequirements(rawUserPrompt) {
    const systemPrompt = `Você é um Engenheiro de Requisitos e Analista de Sistemas Senior.
    Sua missão é pegar o pedido bruto do usuário e estruturá-lo em requisitos técnicos claros.
    
    REGRAS OBRIGATÓRIAS:
    1. Responda EXCLUSIVAMENTE com um JSON válido.
    2. NÃO use formatação markdown (como \`\`\`json).
    
    ESTRUTURA ESPERADA DO JSON:
    {
      "objective": "Resumo claro do que será construído",
      "pagesOrEndpoints": ["Lista de rotas, telas ou endpoints principais"],
      "databaseNeeded": true/false,
      "coreFeatures": ["Funcionalidade 1", "Funcionalidade 2"]
    }`;

    console.log(`\n📋 Analisador de Requisitos: Processando a solicitação do usuário...`);
    
    const model = getBestModelForTask('planning');
    const rawResponse = await callAI(systemPrompt, rawUserPrompt, model);
    
    try {
        const cleanJson = rawResponse.replace(/```json/gi, '').replace(/```/gi, '').trim();
        const analysis = JSON.parse(cleanJson);
        console.log(`✅ Requisitos analisados com sucesso.`);
        return analysis;
    } catch (error) {
        console.error("❌ Erro ao processar requisitos.", rawResponse);
        throw new Error("Falha no parse do JSON de Requisitos.");
    }
}
