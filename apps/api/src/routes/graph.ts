// ──────────────────────────────────────────────
// ECHO — Graph Route
// ──────────────────────────────────────────────

import { Router } from 'express';
import type { ApiResponse, KnowledgeGraphData } from '@echo/types';
import type { KnowledgeGraph } from '@echo/graph';

export function createGraphRouter(graph: KnowledgeGraph): Router {
  const router = Router();

  router.get('/graph', (_req, res) => {
    try {
      const graphData = graph.getGraph();
      const response: ApiResponse<KnowledgeGraphData> = { data: graphData };
      res.json(response);
    } catch (err) {
      const response: ApiResponse<KnowledgeGraphData> = {
        error: { code: 'GRAPH_ERROR', message: String(err) },
      };
      res.status(500).json(response);
    }
  });

  return router;
}
