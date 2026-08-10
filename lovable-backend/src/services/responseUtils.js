export function normalizeText(value) {
    if (value == null) return '';
    if (typeof value === 'string') return value;
    if (Array.isArray(value)) {
        return value
            .map((item) => {
                if (typeof item === 'string') return item;
                if (item?.type === 'text' && typeof item.text === 'string') return item.text;
                if (typeof item?.text === 'string') return item.text;
                return '';
            })
            .join('');
    }
    if (typeof value === 'object') {
        if (value.message?.content != null) return normalizeText(value.message.content);
        if (value.choices?.[0]?.message?.content != null) return normalizeText(value.choices[0].message.content);
        if (typeof value.text === 'string') return value.text;
        if (typeof value.content === 'string' || Array.isArray(value.content)) {
            return normalizeText(value.content);
        }
    }
    return String(value);
}

export function stripCodeFences(value) {
    let text = normalizeText(value).trim();
    text = text.replace(/^```(?:json|javascript|typescript|js|ts|html|css|bash|text)?\s*/i, '');
    text = text.replace(/\s*```\s*$/i, '');
    return text.trim();
}

export function parseJsonResponse(value, label = 'resposta da IA') {
    const text = stripCodeFences(value);
    if (!text) throw new Error(`${label} vazia.`);

    try {
        return JSON.parse(text);
    } catch (firstError) {
        const objectStart = Math.min(...[text.indexOf('{'), text.indexOf('[')].filter((index) => index >= 0));
        const objectEnd = Math.max(text.lastIndexOf('}'), text.lastIndexOf(']'));
        if (Number.isFinite(objectStart) && objectEnd > objectStart) {
            try {
                return JSON.parse(text.slice(objectStart, objectEnd + 1));
            } catch {
                // Preserve the original parse error below with useful context.
            }
        }
        throw new Error(`Não foi possível interpretar ${label} como JSON: ${firstError.message}`);
    }
}

export function assertStringResponse(value, label = 'resposta da IA') {
    const text = stripCodeFences(value);
    if (!text) throw new Error(`${label} vazia.`);
    return text;
}
