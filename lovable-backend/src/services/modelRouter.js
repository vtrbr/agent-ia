/**
 * Roteador Dinâmico de Modelos
 * Mapeia o tipo de tarefa para o LLM mais eficiente (Custo/Benefício/Inteligência)
 */
export function getBestModelForTask(taskType) {
    const routes = {
        'planning': 'openai/gpt-4o-mini',       // Rápido e excelente para gerar JSONs estruturados
        'coding': 'deepseek-chat',              // Imbatível em custo-benefício para escrever código bruto
        'dependencies': 'openai/gpt-4o-mini',   // Tarefa simples, modelo rápido
        'debugging': 'google/gemini-2.5-flash', // Janela de contexto gigante, ótimo para ler logs de erro enormes
        'security': 'openai/gpt-4o',            // Raciocínio complexo necessário para caçar vulnerabilidades
        'default': 'openai/gpt-4o-mini'
    };

    const selectedModel = routes[taskType] || routes['default'];
    console.log(`🔀 [Router] Tarefa '${taskType}' roteada para: ${selectedModel}`);
    
    return selectedModel;
}
