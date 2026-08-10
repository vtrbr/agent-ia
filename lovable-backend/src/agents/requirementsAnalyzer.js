import { callAI } from '../services/puterService.js';

export async function analyzeRequirements(rawIdea) {
    const prompt = `Analise a ideia de software e retorne APENAS um objeto JSON válido (sem markdown, apenas o JSON puro) com esta estrutura exata:
{
    "objective": "Descrição do objetivo",
    "features": ["Funcionalidade 1"],
    "techStack": "Node.js com Express",
    "outputFileName": "index.js"
}
Ideia: "${rawIdea}"`;

    try {
        const response = await callAI(prompt);
        if (!response) throw new Error("Resposta da IA veio vazia.");

        let cleaned = String(response).trim();
        if (cleaned.startsWith('```')) {
            cleaned = cleaned.replace(/^```(json)?/, '').replace(/```$/, '').trim();
        }

        return JSON.parse(cleaned);
    } catch (error) {
        console.warn("⚠️ Aviso no Requisitos (usando fallback):", error.message);
        return {
            objective: rawIdea,
            features: ["Calculadora de frete por CEP"],
            techStack: "Node.js com Express",
            outputFileName: "index.js"
        };
    }
}
