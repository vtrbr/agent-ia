/**
 * Roteador Dinâmico de Modelos
 * Mapeia o tipo de tarefa para o LLM mais eficiente (Custo/Benefício/Inteligência)
 */
export function getBestModelForTask(taskType) {
    const routes = {
        planning: process.env.PUTER_MODEL_PLANNING || 'gpt-5.4-nano',
        coding: process.env.PUTER_MODEL_CODING || 'deepseek-chat',
        dependencies: process.env.PUTER_MODEL_DEPENDENCIES || 'gpt-5.4-nano',
        debugging: process.env.PUTER_MODEL_DEBUGGING || 'google/gemini-2.5-flash',
        security: process.env.PUTER_MODEL_SECURITY || 'gpt-5.4-nano',
        default: process.env.PUTER_MODEL_DEFAULT || 'gpt-5.4-nano'
    };

    const selectedModel = routes[taskType] || routes['default'];
    console.log(`🔀 [Router] Tarefa '${taskType}' roteada para: ${selectedModel}`);
    
    return selectedModel;
}
