import { callAI } from '../services/puterService.js'; // Ajuste conforme o export real do seu puterService

export async function analyzeRequirements(rawIdea) {
    const prompt = `Analise a ideia de software fornecida pelo usuário e retorne APENAS um objeto JSON válido (sem blocos de código markdown, apenas o JSON puro) com a seguinte estrutura:
{
    "objective": "Descrição clara do objetivo do projeto",
    "features": ["Funcionalidade 1", "Funcionalidade 2"],
    "techStack": "Tecnologias principais sugeridas",
    "outputFileName": "index.js"
}

Ideia do usuário: "${rawIdea}"`;

    try {
        const response = await callAI(prompt);
        
        let cleanedResponse = response.trim();
        if (cleanedResponse.startsWith('```')) {
            cleanedResponse = cleanedResponse.replace(/^```(json)?/, '').replace(/```$/, '').trim();
        }

        return JSON.parse(cleanedResponse);

    } catch (error) {
        console.error("❌ Erro ao processar requisitos via IA, usando fallback:", error.message);
        
        // Fallback robusto para o pipeline não parar
        return {
            objective: rawIdea,
            features: ["Gerenciamento de dados", "Interface principal"],
            techStack: "Node.js com Express",
            outputFileName: "index.js"
        };
    }
}
