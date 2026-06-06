// ──────────────────────────────────────────────
// ECHO — API Entry Point
// ──────────────────────────────────────────────

import dotenv from 'dotenv';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { logger } from '@echo/types';
import { createEchoServer } from './server.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: resolve(__dirname, '..', '..', '..', '.env') });

// ── Validate env ──────────────────────────────
function validateEnv(): void {
  const required = ['GROQ_API_KEY'];
  const missing = required.filter((key) => !process.env[key]);

  if (missing.length > 0) {
    logger.error('Missing required environment variables', { missing });
    process.exit(1);
  }

  logger.info('Environment validated', {
    hindsight: !!process.env.HINDSIGHT_API_KEY,
    groqModel: process.env.GROQ_MODEL ?? 'qwen/qwen3-32b',
    debug: process.env.DEBUG === 'true',
  });
}

// ── Start ─────────────────────────────────────
async function main(): Promise<void> {
  validateEnv();

  const port = parseInt(process.env.API_PORT ?? '3001', 10);

  try {
    const { start, services } = await createEchoServer();

    // Export services for the slack bot to potentially import
    (globalThis as Record<string, unknown>).__echoServices = services;

    start(port);

    logger.info('ECHO API is ready', {
      port,
      memoryBackend: services.memory.isUsingHindsight() ? 'hindsight' : 'in-memory',
    });
  } catch (err) {
    logger.error('Failed to start ECHO API', { error: String(err) });
    process.exit(1);
  }
}

main();
