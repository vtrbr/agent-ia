import { callAI } from '../services/puterService.js';
import { getBestModelForTask } from '../services/modelRouter.js';

export async function fixCode(filePath, currentCode, errorMessage) {
    const systemPrompt = `Você é um Engenheiro especialista em Debugging.
    Analise o erro e reescreva o código corrigido.
    
    REGRAS OBRIGATÓRIAS:
    1. Retorne APENAS o código-fonte corrigido.
    2. NÃO use formatação markdown.
    3. NÃO explique o que você mudou.`;

    const userPrompt = `Arquivo com falha: ${filePath}
    
    --- ERRO NO TERMINAL ---
    ${errorMessage}
    
    --- CÓDIGO ATUAL ---
    ${currentCode}
    
    Retorne o código corrigido:`;

    console.log(`🛠️ Testador: Analisando e corrigindo erro em ${filePath}...`);
    
    const model = getBestModelForTask('debugging');
    const rawFixedCode = await callAI(systemPrompt, userPrompt, model);
    const cleanCode = rawFixedCode.replace(/^```[\w]*\n/i, '').replace(/```$/i, '').trim();
    
    return cleanCode;
}
