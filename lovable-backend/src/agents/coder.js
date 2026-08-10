import { callAI } from '../services/puterService.js';
import { getBestModelForTask } from '../services/modelRouter.js';
import { assertStringResponse } from '../services/responseUtils.js';

export async function generateCode(filePath, fileDescription, projectContext) {
    const systemPrompt = `Você é um Desenvolvedor Senior Especialista.
    Sua missão é escrever o código perfeito para um arquivo específico.

    REGRAS OBRIGATÓRIAS E RESTRITAS:
    1. Retorne APENAS o código-fonte puro.
    2. NÃO use formatação markdown.
    3. NÃO adicione explicações.`;

    const userPrompt = `Contexto Geral: ${projectContext}
    Arquivo a ser criado: ${filePath}
    Descrição: ${fileDescription}

    Escreva o código:`;

    console.log(`💻 Programador: Escrevendo código para ${filePath}...`);
    
    const model = getBestModelForTask('coding');
    const rawCode = await callAI(systemPrompt, userPrompt, model);
    return assertStringResponse(rawCode, `código gerado para ${filePath}`);
}
