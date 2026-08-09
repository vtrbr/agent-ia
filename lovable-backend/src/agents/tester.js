import { callAI } from '../services/puterService.js';

export async function fixCode(filePath, currentCode, errorMessage) {
    const systemPrompt = `Você é um Engenheiro de Software especialista em Debugging (Self-Healing).
    Você receberá um código fonte que quebrou e o log de erro exato do terminal.
    
    Sua missão é analisar o erro e reescrever o código de forma corrigida.
    
    REGRAS OBRIGATÓRIAS:
    1. Retorne APENAS o código-fonte corrigido e completo.
    2. NÃO use formatação markdown (como \`\`\`).
    3. NÃO explique o que você mudou, apenas retorne o código pronto para ser salvo.`;

    const userPrompt = `Arquivo que apresentou falha: ${filePath}
    
    --- ERRO NO TERMINAL ---
    ${errorMessage}
    
    --- CÓDIGO ATUAL COM DEFEITO ---
    ${currentCode}
    
    Retorne o código fonte totalmente corrigido:`;

    console.log(`🛠️ Testador: Analisando e corrigindo erro em ${filePath}...`);
    
    const rawFixedCode = await callAI(systemPrompt, userPrompt, 'deepseek-chat');
    const cleanCode = rawFixedCode.replace(/^```[\w]*\n/i, '').replace(/```$/i, '').trim();
    
    return cleanCode;
}
