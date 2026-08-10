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

function isRetryable(error) {
    const status = error?.status || error?.statusCode;
    const message = String(error?.message || error).toLowerCase();
    return ![401, 403].includes(status) && !message.includes('unauthorized') && !message.includes('forbidden') && !message.includes('invalid token');
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export async function callAI(systemPrompt, userPrompt = '', model = process.env.PUTER_MODEL_DEFAULT || 'gpt-5.4-nano', options = {}) {
    const messages = [
        { role: 'system', content: String(systemPrompt || '') },
        { role: 'user', content: String(userPrompt || '') },
    ];

    const maxAttempts = Math.max(1, Number(options.maxAttempts || process.env.PUTER_MAX_ATTEMPTS || 2));
    const chatOptions = { ...options, model, stream: false, temperature: options.temperature ?? 0.2 };
    delete chatOptions.maxAttempts;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        try {
            const response = await getPuter().ai.chat(messages, chatOptions);
            const text = extractChatText(response).trim();
            if (!text) throw new Error('O Puter retornou uma resposta sem conteúdo textual.');
            return text;
        } catch (error) {
            const detail = error?.message || String(error);
            console.error(`❌ [PuterService | ${model} | tentativa ${attempt}/${maxAttempts}] ${detail}`);
            if (attempt >= maxAttempts || !isRetryable(error)) {
                throw new Error(`Falha na chamada ao Puter: ${detail}`, { cause: error });
            }
            await sleep(300 * 2 ** (attempt - 1));
        }
    }
    throw new Error('Falha inesperada no ciclo de chamadas ao Puter.');
}

export function resetPuterClient() {
    puterInstance = undefined;
}
