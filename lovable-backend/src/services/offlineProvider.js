import path from 'path';

function extractField(prompt, label) {
    const match = String(prompt).match(new RegExp(`${label}\\s*[:=]\\s*([^\\n]+)`, 'i'));
    return match?.[1]?.trim() || '';
}

export function offlineChat(systemPrompt = '', userPrompt = '') {
    const system = String(systemPrompt);
    const user = String(userPrompt);
    const combined = `${system}\n${user}`;

    if (/Analise a ideia de software/i.test(combined)) {
        let objective = user || combined.match(/Ideia:\s*["']?(.+?)["']?$/is)?.[1]?.trim() || combined;
        try {
            const parsed = JSON.parse(user);
            objective = parsed.changeRequest || parsed.objective || user;
        } catch {}
        return JSON.stringify({
            objective: String(objective).slice(0, 500),
            features: ['API principal', 'Validação de entradas', 'Testes automatizados'],
            techStack: 'Node.js com Express',
            outputFileName: 'index.js'
        });
    }

    if (/dependências|dependencias|array de strings/i.test(system)) return JSON.stringify(['express', 'cors']);

    if (/plano de arquivos|plano arquitetural|arquiteto/i.test(system)) {
        return JSON.stringify({
            files: [
                { path: 'package.json', description: 'Manifesto mínimo da aplicação Node.js.' },
                { path: 'index.js', description: 'Servidor HTTP inicial com endpoint de saúde.' },
                { path: 'test/index.test.js', description: 'Teste automatizado do endpoint principal.' }
            ]
        });
    }

    if (/interface|UI\/UX|design system/i.test(system) && /JSON/i.test(system)) {
        return JSON.stringify({
            designSystem: { style: 'clean', primaryColor: '#2563eb', typography: 'Inter' },
            componentsNeeded: ['Header', 'Form', 'FeedbackPanel'],
            layoutFlow: 'Header → conteúdo principal → feedback'
        });
    }

    if (/banco de dados|database|entidades/i.test(system) && /JSON/i.test(system)) {
        return JSON.stringify({ databaseType: 'Firebase Firestore', entities: ['users', 'projects', 'jobs', 'artifacts'] });
    }

    if (/auditoria de segurança|segurança|security/i.test(system)) return 'SEGURO';

    if (/correção|corrigir|self-healing/i.test(combined)) return extractField(user, 'Código atual') || '// fallback correction';

    if (/código-fonte|escrever o código|arquivo a ser criado/i.test(system)) {
        const filePath = extractField(user, 'Arquivo a ser criado') || 'index.js';
        if (path.basename(filePath) === 'package.json') return JSON.stringify({ type: 'module', scripts: { test: 'node --test' }, dependencies: { express: '^4.19.2' } }, null, 2);
        if (filePath.includes('test/')) return "import test from 'node:test';\nimport assert from 'node:assert/strict';\ntest('smoke test', () => assert.equal(true, true));\n";
        return "import express from 'express';\nconst app = express();\napp.use(express.json());\napp.get('/health', (_req, res) => res.json({ ok: true }));\nconst port = process.env.PORT || 3001;\nif (process.env.NODE_ENV !== 'test') app.listen(port, () => console.log(`App running on ${port}`));\nexport default app;\n";
    }

    return JSON.stringify({ ok: true, mode: 'offline', message: 'Resposta determinística de desenvolvimento.' });
}
