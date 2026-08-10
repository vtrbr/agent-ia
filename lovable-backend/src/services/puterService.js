import { init } from '@heyputer/puter.js/src/init.cjs';
import { normalizeText } from './responseUtils.js';

let puterInstance;

function getPuter() {
    if (!puterInstance) {
        const authToken = process.env.PUTER_AUTH_TOKEN || process.env.PUTER_TOKEN;
        if (!authToken) {
            throw new Error('PUTER_AUTH_TOKEN não configurado. Defina o token de autenticação do Puter antes de chamar a IA.');
        }
        puterInstance = init(authToken);
    }
    return puterInstance;
}

function extractChatText(response) {
    if (typeof response === 'string') return response;
    if (response?.message?.content != null) return normalizeText(response.message.content);
    if (response?.content != null) return normalizeText(response.content);
    if (response?.choices?.[0]?.message?.content != null) return normalizeText(response.choices[0].message.content);
    if (response?.text != null) return normalizeText(response.text);
    return normalizeText(response);
}

export async function callAI(systemPrompt, userPrompt = '', model = 'gpt-5-nano', options = {}) {
    const messages = [
        { role: 'system', content: String(systemPrompt || '') },
        { role: 'user', content: String(userPrompt || '') },
    ];

    try {
        const response = await getPuter().ai.chat(messages, {
            model,
            stream: false,
            temperature: options.temperature ?? 0.2,
            ...options,
        });
        const text = extractChatText(response).trim();
        if (!text) throw new Error('O Puter retornou uma resposta sem conteúdo textual.');
        return text;
    } catch (error) {
        const detail = error?.message || String(error);
        console.error(`❌ [PuterService | ${model}] ${detail}`);
        throw new Error(`Falha na chamada ao Puter: ${detail}`, { cause: error });
    }
}

export function resetPuterClient() {
    puterInstance = undefined;
}
