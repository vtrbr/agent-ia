import test from 'node:test';
import assert from 'node:assert/strict';
import { offlineChat } from '../src/services/offlineProvider.js';

test('offline provider returns requirements JSON', () => {
    const value = JSON.parse(offlineChat('Analise a ideia de software e retorne JSON', 'Ideia: API de tarefas'));
    assert.equal(value.techStack, 'Node.js com Express');
});

test('offline provider returns a dependency array', () => {
    const value = JSON.parse(offlineChat('Você é um Gerente de Dependências. Responda array de strings.', '{}'));
    assert.deepEqual(value, ['express', 'cors']);
});

test('offline provider returns safe marker and valid code', () => {
    assert.equal(offlineChat('Você é um Engenheiro de Segurança. Responda SEGURO.', '{}'), 'SEGURO');
    assert.match(offlineChat('Você é um Desenvolvedor. Retorne código-fonte puro.', 'Arquivo a ser criado: index.js'), /express/);
});
