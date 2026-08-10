import test from 'node:test';
import assert from 'node:assert/strict';
import { initWorkspace, writeFile, getWorkspaceDir } from '../src/services/tools.js';
import { enqueueJob, getJob } from '../src/services/jobQueue.js';

test('impede escrita fora do workspace do projeto', async () => {
    await initWorkspace('test-project');
    const result = await writeFile('../escape.txt', 'não deve sair');
    assert.match(result, /Erro ao salvar/);
    assert.equal(getWorkspaceDir().endsWith('/workspace/test-project'), true);
});

test('processa job e emite evento de conclusão', async () => {
    const job = enqueueJob({
        projectId: 'test-project',
        prompt: 'teste',
        worker: async ({ report }) => {
            report('pipeline.step', { ok: true });
            return { ok: true };
        },
    });
    await new Promise((resolve) => setTimeout(resolve, 20));
    const completed = getJob(job.id);
    assert.equal(completed.status, 'completed');
    assert.equal(completed.events.some((event) => event.event === 'pipeline.step'), true);
    assert.equal(completed.events.at(-1).event, 'job.completed');
});
