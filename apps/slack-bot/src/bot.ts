// ──────────────────────────────────────────────
// ECHO — Slack Bolt Bot
// ──────────────────────────────────────────────

import { App } from '@slack/bolt';
import { logger } from '@echo/types';
import type { EchoAgent } from '@echo/agent';
import { IngestionPipeline, type IncomingMessage } from './ingestion.js';

export function createSlackBot(
  pipeline: IngestionPipeline,
  agent: EchoAgent
): App {
  const app = new App({
    token: process.env.SLACK_BOT_TOKEN,
    appToken: process.env.SLACK_APP_TOKEN,
    socketMode: true,
  });

  // Listen for all messages (not from bots)
  app.message(async ({ message, say }) => {
    try {
      // Type guard for standard messages
      if (!('text' in message) || !message.text) return;
      // Allow bot messages so population script works

      const userId = 'user' in message ? String(message.user) : 'unknown';
      const channelId = 'channel' in message ? String(message.channel) : 'unknown';

      const incoming: IncomingMessage = {
        text: message.text,
        author: userId,
        channel: channelId,
        platform: 'slack',
        timestamp: new Date().toISOString(),
      };

      // Add to batch for processing
      pipeline.addToBatch(incoming);

      // Check if this is an @echo mention
      if (message.text.toLowerCase().includes('@echo') || message.text.includes('<@')) {
        const query = message.text
          .replace(/<@[A-Z0-9]+>/g, '')
          .replace(/@echo/gi, '')
          .trim();

        if (query) {
          logger.info('Echo mention detected', { query, user: userId });
          const response = await agent.ask(query);
          await say({
            text: response.answer,
            thread_ts: 'ts' in message ? String(message.ts) : undefined,
          });
        }
      }
    } catch (err) {
      logger.error('Slack message handler error', { error: String(err) });
    }
  });

  // Start batch processing for non-mention messages
  pipeline.startBatchProcessing(30_000);

  return app;
}
