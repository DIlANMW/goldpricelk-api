import { Router } from 'express';
import { checkDatabase } from '../config/database.js';
import { env } from '../config/env.js';

const router = Router();
const startedAt = Date.now();

router.get('/live', (_req, res) => {
  res.status(200).json({
    status: 'ok',
    service: 'goldpricelk-api',
    timestamp: new Date().toISOString(),
    uptimeSeconds: Math.floor(process.uptime()),
  });
});

router.get('/ready', (_req, res) => {
  try {
    checkDatabase();
    res.status(200).json({
      status: 'ready',
      checks: { database: 'ok' },
      timestamp: new Date().toISOString(),
    });
  } catch {
    res.status(503).json({
      status: 'not_ready',
      checks: { database: 'error' },
      timestamp: new Date().toISOString(),
    });
  }
});

router.get('/', (_req, res) => {
  res.status(200).json({
    status: 'ok',
    service: 'GoldPriceLK API',
    version: '1.0.0',
    environment: env.nodeEnv,
    uptimeSeconds: Math.floor((Date.now() - startedAt) / 1000),
    timestamp: new Date().toISOString(),
  });
});

export default router;
