import { callAI } from '../services/puterService.js';

export async function generateCode(filePath, fileDescription, projectContext) {
    const systemPrompt = `Você é um Desenvolvedor Senior Especialista.
    Sua missão é escrever o código perfeito para um arquivo específico com base na arquitetura solicitada.

    REGRAS OBRIGATÓRIAS E RESTRITAS:
    1. Retorne APENAS o código-fonte puro.
    2. NÃO use formatação markdown (como \`\`\`javascript ou \`\`\`).
    3. NÃO adicione explicações, comentários fora do código ou saudações. O resultado será injetado diretamente em um arquivo.`;

    const userPrompt = `Contexto Geral do Projeto: ${projectContext}
    Arquivo a ser criado: ${filePath}
    Descrição da responsabilidade deste arquivo: ${fileDescription}

    Escreva o código:`;

    console.log(`💻 Programador: Escrevendo código para o arquivo ${filePath}...`);
    
    const rawCode = await callAI(systemPrompt, userPrompt, 'deepseek-chat');
    const cleanCode = rawCode.replace(/^```[\w]*\n/i, '').replace(/```$/i, '').trim();
    
    return cleanCode;
}
