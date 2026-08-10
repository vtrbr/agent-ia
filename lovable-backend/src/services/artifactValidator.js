const SAFE_PATH = /^(?!\.)(?!.*(?:^|\/)\.\.(?:\/|$))[a-zA-Z0-9._\-/]+$/;

export function validatePlan(plan) {
    if (!plan || !Array.isArray(plan.files) || plan.files.length === 0) {
        throw new Error('O arquiteto não retornou um plano de arquivos válido.');
    }
    if (plan.files.length > 200) throw new Error('O plano excede o limite de 200 arquivos.');

    const files = plan.files.map((file, index) => {
        if (!file || typeof file !== 'object') throw new Error(`Arquivo ${index + 1} do plano é inválido.`);
        const path = String(file.path || '').trim();
        const description = String(file.description || '').trim();
        if (!SAFE_PATH.test(path) || path.length > 240) throw new Error(`Caminho inválido no plano: ${path}`);
        if (!description || description.length > 4000) throw new Error(`Descrição inválida para: ${path}`);
        return { path, description };
    });

    const uniquePaths = new Set(files.map((file) => file.path));
    if (uniquePaths.size !== files.length) throw new Error('O plano contém caminhos duplicados.');
    return { ...plan, files };
}
