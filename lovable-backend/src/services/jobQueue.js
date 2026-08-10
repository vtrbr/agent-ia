import { randomUUID } from 'crypto';

const jobs = new Map();
const listeners = new Map();
let running = false;
const pending = [];

function emit(job, event, data = {}) {
    const entry = { id: randomUUID(), at: new Date().toISOString(), event, data };
    job.events.push(entry);
    if (job.events.length > 200) job.events.shift();
    for (const listener of listeners.get(job.id) || []) listener(entry);
}

async function drain() {
    if (running) return;
    running = true;
    while (pending.length) {
        const task = pending.shift();
        const job = jobs.get(task.job.id);
        if (!job) continue;
        job.status = 'running';
        job.startedAt = new Date().toISOString();
        emit(job, 'job.started');
        try {
            const result = await task.worker({
                report: (event, data) => emit(job, event, data),
            });
            job.status = 'completed';
            job.result = result || null;
            job.completedAt = new Date().toISOString();
            emit(job, 'job.completed', { result: job.result });
        } catch (error) {
            job.status = 'failed';
            job.error = error.message;
            job.completedAt = new Date().toISOString();
            emit(job, 'job.failed', { error: job.error });
        }
    }
    running = false;
}

export function enqueueJob({ projectId, prompt, worker }) {
    const job = {
        id: randomUUID(),
        projectId,
        prompt,
        status: 'queued',
        createdAt: new Date().toISOString(),
        events: [],
    };
    jobs.set(job.id, job);
    emit(job, 'job.queued');
    pending.push({ job, worker });
    void drain();
    return job;
}

export function getJob(jobId) {
    return jobs.get(jobId) || null;
}

export function listProjectJobs(projectId) {
    return [...jobs.values()].filter((job) => job.projectId === projectId);
}

export function getQueueStats() {
    const all = [...jobs.values()];
    return {
        total: all.length,
        queued: all.filter((job) => job.status === 'queued').length,
        running: all.filter((job) => job.status === 'running').length,
        completed: all.filter((job) => job.status === 'completed').length,
        failed: all.filter((job) => job.status === 'failed').length,
        pending: pending.length,
    };
}

export function subscribeJob(jobId, listener) {
    const set = listeners.get(jobId) || new Set();
    set.add(listener);
    listeners.set(jobId, set);
    return () => {
        set.delete(listener);
        if (!set.size) listeners.delete(jobId);
    };
}
