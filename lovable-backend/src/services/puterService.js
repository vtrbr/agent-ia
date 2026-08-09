import { puter } from '@heyputer/puter.js';

export async function callAI(systemPrompt, userPrompt, model = 'openai/gpt-4o-mini') {
    try {
        const promptCompleto = `[INSTRUÇÕES DE SISTEMA]\n${systemPrompt}\n\n[ENTRADA DO USUÁRIO]\n${userPrompt}`;
        const response = await puter.ai.chat(promptCompleto, { model: model });
        return response.message.content;
    } catch (error) {
        console.error(`❌ [Erro Crítico no PuterService - Modelo: ${model}]:`, error.message);
        throw error;
    }
}
