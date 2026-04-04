import { createServer } from 'node:http';
import { URL } from 'node:url';
import type { IncomingMessage, ServerResponse } from 'node:http';
import type { ScoreInput } from './service/Score.ts';
import { ScoreService } from './service/Score.ts';
import Score from './model/Score.js';

const PORT = Number(process.env.PORT) || 3333;
const DB_PATH = process.env.SCORE_DB_PATH || './scores.db';

const scoreService = new ScoreService(DB_PATH, Score);

function writeJson(res: ServerResponse, statusCode: number, payload: unknown): void {
  res.writeHead(statusCode, {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET,POST,DELETE,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  });
  res.end(JSON.stringify(payload));
}

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
  await scoreService.close();
  server.close(() => process.exit(0));
});
