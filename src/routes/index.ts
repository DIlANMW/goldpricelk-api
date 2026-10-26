import { Router } from 'express';
import healthRoutes from './health.routes.js';
import goldRoutes from './gold.routes.js';

const router = Router();

router.get('/', (_req, res) => {
  res.json({
    name: 'GoldPriceLK API',
    version: '1.0.0',
    endpoints: {
      health: '/api/health',
      liveness: '/api/health/live',
      readiness: '/api/health/ready',
    },
  });
});

router.use('/health', healthRoutes);
router.use('/gold', goldRoutes);

export default router;
