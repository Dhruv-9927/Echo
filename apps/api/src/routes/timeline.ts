// ──────────────────────────────────────────────
// ECHO — Timeline Route
// ──────────────────────────────────────────────

import { Router } from 'express';
import type { ApiResponse, EchoMemory } from '@echo/types';
import type { EchoMemoryClient } from '@echo/memory';

export function createTimelineRouter(memory: EchoMemoryClient): Router {
  const router = Router();

  router.get('/timeline', (req, res) => {
    try {
      const from = req.query.from as string | undefined;
      const to = req.query.to as string | undefined;

      let memories: EchoMemory[];

      if (from && to) {
        memories = memory.getByTimeRange(from, to);
      } else {
        // Default: last 7 days
        const now = new Date();
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        memories = memory.getByTimeRange(weekAgo.toISOString(), now.toISOString());
      }

      const response: ApiResponse<EchoMemory[]> = {
        data: memories,
        meta: { total: memories.length },
      };
      res.json(response);
    } catch (err) {
      const response: ApiResponse<EchoMemory[]> = {
        error: { code: 'TIMELINE_ERROR', message: String(err) },
      };
      res.status(500).json(response);
    }
  });

  return router;
}
