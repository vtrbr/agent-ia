import { callRouter } from '../services/routerService.js'; // ou o serviço de IA que você está usando

export async function analyzeRequirements(rawIdea) {
    const prompt = `Analise a ideia de software fornecida pelo usuário e retorne APENAS um objeto JSON válido (sem blocos de código markdown como \`\`\`json, apenas o JSON puro) com a seguinte estrutura:
{
    "objective": "Descrição clara do objetivo do projeto",
    "features": ["Funcionalidade 1", "Funcionalidade 2"],
    "techStack": "Tecnologias principais sugeridas",
    "outputFileName": "index.js"
}

Ideia do usuário: "${rawIdea}"`;

    try {
        const response = await callRouter('planning', prompt);
        
        // Remove marcações de markdown caso a IA coloque (ex: ```json ... ```)
        let cleanedResponse = response.trim();
        if (cleanedResponse.startsWith('```')) {
            cleanedResponse = cleanedResponse.replace(/^```(json)?/, '').replace(/```$/, '').trim();
        }

        // Tenta fazer o parse do JSON
        return JSON.parse(cleanedResponse);

    } catch (error) {
        console.error("❌ Erro ao processar requisitos:", error.message);
        
        // Fallback de segurança para não quebrar o pipeline caso a IA falhe
        return {
            objective: rawIdea,
            features: ["Funcionalidade padrão gerada por fallback"],
            techStack: "Node.js com Express",
            outputFileName: "index.js"
        };
    }
}
