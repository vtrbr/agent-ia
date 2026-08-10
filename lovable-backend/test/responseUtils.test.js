import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeText, stripCodeFences, parseJsonResponse } from '../src/services/responseUtils.js';

test('normaliza conteúdo textual do ChatResponse', () => {
    assert.equal(normalizeText({ message: { content: [{ type: 'text', text: 'olá' }] } }), 'olá');
    assert.equal(normalizeText({ content: 'texto' }), 'texto');
});

test('remove cercas de código', () => {
    assert.equal(stripCodeFences('```json\n{"ok":true}\n```'), '{"ok":true}');
});

test('extrai JSON cercado por texto adicional', () => {
    assert.deepEqual(parseJsonResponse('Aqui está:\n```json\n{"files":[]}\n```', 'plano'), { files: [] });
});
