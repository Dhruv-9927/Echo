// ──────────────────────────────────────────────
// ECHO — Slack Bot Entry Point
// ──────────────────────────────────────────────

import dotenv from 'dotenv';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Groq } from 'groq-sdk';
import { logger } from '@echo/types';
import { EchoMemoryClient } from '@echo/memory';
import { KnowledgeGraph } from '@echo/graph';
import { EchoAgent, EntityExtractor } from '@echo/agent';
import { IngestionPipeline } from './ingestion.js';
import { MockSimulator } from './mock-simulator.js';
import { createSlackBot } from './bot.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: resolve(__dirname, '..', '..', '..', '.env') });

async function main(): Promise<void> {
  // ── Initialize services ─────────────────────
  const memory = new EchoMemoryClient();
  await memory.initialize();

  const graph = new KnowledgeGraph();
  graph.calculateDecay();

  const agent = new EchoAgent(memory, graph);

  const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
  const model = process.env.GROQ_MODEL ?? 'qwen/qwen3-32b';
  const extractor = new EntityExtractor(groq, model);

  const pipeline = new IngestionPipeline(memory, graph, extractor, {
    onMemoryAdded: (mem, delta) => {
      fetch('http://localhost:3001/api/webhook/ingest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ memory: mem, graphDelta: delta })
      }).catch(err => logger.error('Webhook ingest failed', { error: String(err) }));
    },
    onGraphPulse: (nodeId) => {
      fetch('http://localhost:3001/api/webhook/pulse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nodeId })
      }).catch(err => logger.error('Webhook pulse failed', { error: String(err) }));
    }
  });

  // ── Decide mode ─────────────────────────────
  const slackToken = process.env.SLACK_BOT_TOKEN;

  if (slackToken) {
    // Real Slack mode
    logger.info('Starting in Slack mode');

    try {
      const app = createSlackBot(pipeline, agent);
      await app.start();
      logger.info('Slack bot connected and listening');
    } catch (err) {
      logger.error('Failed to start Slack bot', { error: String(err) });
      process.exit(1);
    }
  } else {
    // Mock/simulator mode
    logger.info('No SLACK_BOT_TOKEN found — starting in mock simulator mode');

    const simulator = new MockSimulator(pipeline);
    simulator.start(15_000);

    // Graceful shutdown
    process.on('SIGINT', () => {
      logger.info('Shutting down mock simulator');
      simulator.stop();
      process.exit(0);
    });

    process.on('SIGTERM', () => {
      logger.info('Shutting down mock simulator');
      simulator.stop();
      process.exit(0);
    });
  }
}

main().catch((err) => {
  logger.error('Slack bot startup failed', { error: String(err) });
  process.exit(1);
});
