import { callAI } from '../services/puterService.js';
import { getBestModelForTask } from '../services/modelRouter.js';
import { assertStringResponse } from '../services/responseUtils.js';

export async function auditCode(filePath, code) {
    const systemPrompt = `Você é um Engenheiro de Segurança de Software (AppSec).
    Sua missão é auditar o código em busca de vulnerabilidades graves (XSS, SQL Injection, credenciais hardcoded, CORS mal configurado, etc).
    
    REGRAS OBRIGATÓRIAS:
    1. Se o código for totalmente SEGURO, responda APENAS com a palavra: "SEGURO".
    2. Se houver falhas, corrija-as silenciosamente e retorne APENAS o código completo, corrigido e blindado.
    3. NÃO use formatação markdown (como \`\`\`). NÃO explique as correções.`;

    const userPrompt = `Audite o arquivo: ${filePath}\n\n--- CÓDIGO ATUAL ---\n${code}`;
    
    console.log(`🛡️ Segurança: Auditando ${filePath} contra vulnerabilidades...`);
    
    // O Router escolhe o melhor modelo para segurança automaticamente!
    const model = getBestModelForTask('security');
    const rawResponse = await callAI(systemPrompt, userPrompt, model);
    
    return assertStringResponse(rawResponse, `auditoria de segurança para ${filePath}`);
}
