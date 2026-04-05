import { createServer } from 'node:http';
import { URL } from 'node:url';
import { randomUUID } from 'node:crypto';
import type { IncomingMessage, ServerResponse } from 'node:http';
import type { ScoreInput } from './service/Score.ts';
import { ScoreService } from './service/Score.ts';
import GenerationService from './service/GenerationService.ts';
import type { GenerationConfig, GenerationResult } from './service/GenerationService.ts';

import Score from './model/Score.js';

const PORT = Number(process.env.PORT) || 3333;
const DB_PATH = process.env.SCORE_DB_PATH || './scores.db';
const JOB_TTL_MS = Number(process.env.GENERATION_JOB_TTL_MS) || 5 * 60 * 1000;

const scoreService = new ScoreService(DB_PATH, Score);
const generationController = new GenerationService();

type GenerationProgress = {
  generation: number;
  bestFitness: number;
  avgFitness: number;
  chromosomeTotal: number;
  totalGenerations: number;
};

type GenerationJobStatus = 'running' | 'completed' | 'stopped' | 'failed';

type GenerationJob = {
  id: string;
  status: GenerationJobStatus;
  createdAt: string;
  updatedAt: string;
  config: Partial<GenerationConfig>;
  progress: GenerationProgress | null;
  result: GenerationResult | null;
  error: string | null;
  stopRequested: boolean;
  clients: Set<ServerResponse>;
};

const generationJobs = new Map<string, GenerationJob>();

function writeJson(res: ServerResponse, statusCode: number, payload: unknown): void {
  res.writeHead(statusCode, {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET,POST,DELETE,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  });
  res.end(JSON.stringify(payload));
}

function writeSseHeaders(res: ServerResponse): void {
  res.writeHead(200, {
    'Content-Type': 'text/event-stream; charset=utf-8',
    'Cache-Control': 'no-cache',
    Connection: 'keep-alive',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET,POST,DELETE,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  });
}

function sendSseEvent(res: ServerResponse, event: string, payload: unknown): void {
  res.write(`event: ${event}\n`);
  res.write(`data: ${JSON.stringify(payload)}\n\n`);
}

function closeJobClients(job: GenerationJob): void {
  for (const client of job.clients) {
    client.end();
  }
  job.clients.clear();
}

function toJobPayload(job: GenerationJob) {
  return {
    id: job.id,
    status: job.status,
    createdAt: job.createdAt,
    updatedAt: job.updatedAt,
    config: job.config,
    progress: job.progress,
    result: job.result,
    error: job.error,
    stopRequested: job.stopRequested,
  };
}

function updateJob(job: GenerationJob, patch: Partial<Omit<GenerationJob, 'id' | 'createdAt' | 'clients'>>): void {
  Object.assign(job, patch);
  job.updatedAt = new Date().toISOString();
}

function broadcastJobEvent(job: GenerationJob, event: string): void {
  if (job.clients.size === 0) return;

  const payload = toJobPayload(job);
  const deadClients: ServerResponse[] = [];

  for (const client of job.clients) {
    try {
      sendSseEvent(client, event, payload);
    } catch {
      deadClients.push(client);
    }
  }

  for (const client of deadClients) {
    job.clients.delete(client);
  }
}

async function runGenerationJob(job: GenerationJob): Promise<void> {
  try {
    const generated = await generationController.run(job.config, {
      shouldStop: () => job.stopRequested,
      onGeneration: (progress: GenerationProgress) => {
        updateJob(job, { progress });
        broadcastJobEvent(job, 'progress');
      },
    });

    updateJob(job, {
      status: generated.stopped ? 'stopped' : 'completed',
      result: generated,
    });

    broadcastJobEvent(job, job.status);
  } catch (error) {
    updateJob(job, {
      status: 'failed',
      error: error instanceof Error ? error.message : 'Erro inesperado ao processar geracao.',
    });
    broadcastJobEvent(job, 'failed');
  } finally {
    closeJobClients(job);
  }
}

function createGenerationJob(config: Partial<GenerationConfig>): GenerationJob {
  const now = new Date().toISOString();
  const job: GenerationJob = {
    id: randomUUID(),
    status: 'running',
    createdAt: now,
    updatedAt: now,
    config,
    progress: null,
    result: null,
    error: null,
    stopRequested: false,
    clients: new Set(),
  };

  generationJobs.set(job.id, job);
  runGenerationJob(job);

  return job;
}

function getJobFromPath(pathname: string): GenerationJob | null {
  const parts = pathname.split('/').filter(Boolean);
  const id = parts[3];

  if (!id) return null;
  return generationJobs.get(id) || null;
}

function isTerminalJobStatus(status: GenerationJobStatus): boolean {
  return status === 'completed' || status === 'stopped' || status === 'failed';
}

const jobCleanupTimer = setInterval(() => {
  const now = Date.now();

  for (const [id, job] of generationJobs.entries()) {
    if (!isTerminalJobStatus(job.status)) continue;

    const updatedAtMs = new Date(job.updatedAt).getTime();
    if (Number.isNaN(updatedAtMs)) continue;

    if (now - updatedAtMs > JOB_TTL_MS) {
      closeJobClients(job);
      generationJobs.delete(id);
    }
  }
}, 30_000);

jobCleanupTimer.unref();

function readJsonBody(req: IncomingMessage): Promise<unknown> {
  return new Promise((resolve, reject) => {
    let raw = '';

    req.on('data', (chunk: Buffer) => {
      raw += chunk;

      if (raw.length > 1_000_000) {
        reject(new Error('Payload muito grande.'));
      }
    });

    req.on('end', () => {
      if (!raw.trim()) {
        resolve({});
        return;
      }

      try {
        resolve(JSON.parse(raw));
      } catch {
        reject(new Error('JSON invalido.'));
      }
    });

    req.on('error', reject);
  });
}

const server = createServer(async (req, res) => {
  const method = req.method || 'GET';
  const url = new URL(req.url || '/', `http://${req.headers.host || 'localhost'}`);

  try {
    if (method === 'OPTIONS') {
      writeJson(res, 200, { ok: true });
      return;
    }

    if (method === 'GET' && url.pathname === '/health') {
      writeJson(res, 200, { ok: true, service: 'knight-tour-score-api' });
      return;
    }

    if (method === 'GET' && url.pathname === '/api/scores') {
      const limitRaw = url.searchParams.get('limit');
      const limit = limitRaw ? Number(limitRaw) : 50;
      const data = await scoreService.listScores(limit);
      writeJson(res, 200, { ok: true, data });
      return;
    }

    if (method === 'POST' && url.pathname === '/api/scores') {
      const body = (await readJsonBody(req)) as ScoreInput;
      const saved = await scoreService.saveScore(body);
      writeJson(res, 201, { ok: true, data: saved });
      return;
    }

    if (method === 'POST' && url.pathname === '/api/generate/jobs') {
      const body = (await readJsonBody(req)) as Partial<GenerationConfig>;
      const job = createGenerationJob(body);
      writeJson(res, 202, { ok: true, data: toJobPayload(job) });
      return;
    }

    if (method === 'GET' && /^\/api\/generate\/jobs\/[^/]+$/.test(url.pathname)) {
      const job = getJobFromPath(url.pathname);

      if (!job) {
        writeJson(res, 404, { ok: false, error: 'Job nao encontrado.' });
        return;
      }

      writeJson(res, 200, { ok: true, data: toJobPayload(job) });
      return;
    }

    if (method === 'GET' && /^\/api\/generate\/jobs\/[^/]+\/events$/.test(url.pathname)) {
      const job = getJobFromPath(url.pathname);

      if (!job) {
        writeJson(res, 404, { ok: false, error: 'Job nao encontrado.' });
        return;
      }

      writeSseHeaders(res);
      sendSseEvent(res, 'snapshot', toJobPayload(job));

      if (isTerminalJobStatus(job.status)) {
        sendSseEvent(res, job.status, toJobPayload(job));
        res.end();
        return;
      }

      job.clients.add(res);

      req.on('close', () => {
        job.clients.delete(res);
      });

      return;
    }

    if (method === 'DELETE' && /^\/api\/generate\/jobs\/[^/]+$/.test(url.pathname)) {
      const job = getJobFromPath(url.pathname);

      if (!job) {
        writeJson(res, 404, { ok: false, error: 'Job nao encontrado.' });
        return;
      }

      if (isTerminalJobStatus(job.status)) {
        writeJson(res, 409, { ok: false, error: 'Job ja finalizado.', data: toJobPayload(job) });
        return;
      }

      updateJob(job, { stopRequested: true });
      broadcastJobEvent(job, 'cancel-requested');
      writeJson(res, 202, { ok: true, data: toJobPayload(job) });
      return;
    }

    if (method === 'DELETE' && url.pathname.startsWith('/api/scores/')) {
      const id = Number(url.pathname.split('/').pop());

      if (!Number.isInteger(id) || id <= 0) {
        writeJson(res, 400, { ok: false, error: 'ID invalido.' });
        return;
      }

      const deleted = await scoreService.deleteScore(id);
      if (!deleted) {
        writeJson(res, 404, { ok: false, error: 'Score nao encontrado.' });
        return;
      }

      writeJson(res, 200, { ok: true, data: { id } });
      return;
    }

    writeJson(res, 404, { ok: false, error: 'Rota nao encontrada.' });
  } catch (error) {
    writeJson(res, 400, {
      ok: false,
      error: error instanceof Error ? error.message : 'Erro inesperado.',
    });
  }
});

async function start() {
  await scoreService.setup();

  server.listen(PORT, () => {
    console.log(`Score API executando em http://localhost:${PORT}`);
  });
}

start().catch((error) => {
  console.error('Falha ao iniciar servidor:', error);
  process.exit(1);
});

process.on('SIGINT', async () => {
  clearInterval(jobCleanupTimer);

  for (const job of generationJobs.values()) {
    closeJobClients(job);
  }

  await scoreService.close();
  server.close(() => process.exit(0));
});
