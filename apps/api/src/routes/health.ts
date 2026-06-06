// ──────────────────────────────────────────────
// ECHO — Health Route
// ──────────────────────────────────────────────

import { Router } from 'express';
import type { ApiResponse } from '@echo/types';

const router = Router();

interface HealthData {
  status: string;
  ts: number;
  uptime: number;
}

router.get('/health', (_req, res) => {
  const response: ApiResponse<HealthData> = {
    data: {
      status: 'ok',
      ts: Date.now(),
      uptime: process.uptime(),
    },
  };
  res.json(response);
});

export const healthRouter: Router = router;
