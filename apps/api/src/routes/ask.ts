// ──────────────────────────────────────────────
// ECHO — Ask Route
// ──────────────────────────────────────────────

import { Router } from 'express';
import type { ApiResponse, AskResponse } from '@echo/types';
import { logger } from '@echo/types';
import type { EchoAgent } from '@echo/agent';

export function createAskRouter(agent: EchoAgent): Router {
  const router = Router();

  router.post('/ask', async (req, res) => {
    try {
      const body = req.body as Record<string, unknown>;
      const query = body.query;

      if (!query || typeof query !== 'string') {
        const response: ApiResponse<AskResponse> = {
          error: { code: 'INVALID_INPUT', message: 'Missing required field: query (string)' },
        };
        res.status(400).json(response);
        return;
      }

      logger.info('Ask request received', { query });
      const result = await agent.ask(query);
      const response: ApiResponse<AskResponse> = { data: result };
      res.json(response);
    } catch (err) {
      logger.error('Ask request failed', { error: String(err) });
      const response: ApiResponse<AskResponse> = {
        error: { code: 'ASK_ERROR', message: String(err) },
      };
      res.status(500).json(response);
    }
  });

  return router;
}
