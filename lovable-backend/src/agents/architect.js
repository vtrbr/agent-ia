import { callAI } from '../services/puterService.js';
import { parseJsonResponse } from '../services/responseUtils.js';

export async function planProject(contextString) {
    const prompt = `Com base no contexto abaixo, retorne APENAS um JSON válido contendo o plano de arquivos do projeto:
{
    "files": [
        {
            "path": "src/server.js",
            "description": "Servidor principal com rotas da API"
        }
    ]
}
Contexto: ${contextString}`;

    try {
        const response = await callAI(prompt);
        if (!response) throw new Error("Resposta da IA veio vazia.");

        return parseJsonResponse(response, 'plano arquitetural');
    } catch (error) {
        console.warn("⚠️ Aviso no Arquiteto (usando plano de fallback):", error.message);
        return {
            files: [
                {
                    "path": "src/server.js",
                    "description": "Servidor Express com endpoint de cálculo de frete"
                }
            ]
        };
    }
}
