// ──────────────────────────────────────────────
// ECHO — Memories Route
// ──────────────────────────────────────────────

import { Router } from 'express';
import type { ApiResponse, EchoMemory, MemoryType } from '@echo/types';
import type { EchoMemoryClient } from '@echo/memory';

export function createMemoriesRouter(memory: EchoMemoryClient): Router {
  const router = Router();

  router.get('/memories', async (req, res) => {
    try {
      const limit = parseInt(String(req.query.limit ?? '20'), 10);
      const offset = parseInt(String(req.query.offset ?? '0'), 10);
      const topic = req.query.topic as string | undefined;
      const author = req.query.author as string | undefined;
      const type = req.query.type as MemoryType | undefined;

      if (topic) {
        // Search by topic
        const memories = await memory.recall(topic, { author, memoryType: type }, limit);
        const response: ApiResponse<EchoMemory[]> = {
          data: memories,
          meta: { total: memories.length },
        };
        res.json(response);
      } else {
        // Filter-based listing
        const result = memory.getByFilters({ author, memoryType: type }, limit, offset);
        const response: ApiResponse<EchoMemory[]> = {
          data: result.memories,
          meta: { total: result.total, page: Math.floor(offset / limit) },
        };
        res.json(response);
      }
    } catch (err) {
      const response: ApiResponse<EchoMemory[]> = {
        error: { code: 'MEMORY_ERROR', message: String(err) },
      };
      res.status(500).json(response);
    }
  });

  return router;
}
