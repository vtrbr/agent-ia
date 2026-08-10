import { callAI } from '../services/puterService.js';
import { getBestModelForTask } from '../services/modelRouter.js';

export async function specifyUIUX(requirements) {
    const systemPrompt = `Você é um Especialista em UI/UX e Design System.
    Sua missão é definir a experiência visual, paleta de cores, componentes de interface e fluxo de navegação para a aplicação descrita.
    
    REGRAS OBRIGATÓRIAS:
    1. Responda EXCLUSIVAMENTE com um JSON válido.
    2. NÃO use formatação markdown (como \`\`\`json).
    
    ESTRUTURA ESPERADA DO JSON:
    {
      "designSystem": {
        "primaryColor": "código hex ou estilo",
        "fontFamily": "tipo de fonte",
        "style": "minimalista / moderno / corporativo"
      },
      "componentsNeeded": ["Componente 1", "Componente 2"],
      "layoutFlow": "Breve descrição de como o usuário navega na tela"
    }`;

    const userPrompt = `Requisitos do projeto: ${JSON.stringify(requirements)}`;
    console.log(`🎨 UI/UX: Desenhando especificações visuais...`);

    const model = getBestModelForTask('planning');
    const rawResponse = await callAI(systemPrompt, userPrompt, model);

    try {
        const cleanJson = rawResponse.replace(/```json/gi, '').replace(/```/gi, '').trim();
        return JSON.parse(cleanJson);
    } catch (error) {
        // Se o projeto for puramente backend/API e não usar UI, retorna um padrão vazio seguro
        return { designSystem: null, componentsNeeded: [], layoutFlow: "API Backend pura" };
    }
}
