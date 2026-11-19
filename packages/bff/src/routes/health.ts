import { Router } from 'express';
import { backendClient } from '../services/backend.client.js';
import { logger } from '../utils/logger.js';

const router = Router();

/**
 * BFF health check — aggregates its own health with backend health.
 * This demonstrates the BFF aggregation pattern: one call from frontend
 * returns combined health status of multiple services.
 */
router.get('/health', async (_req, res) => {
  let backendUp = false;

  try {
    const health = await backendClient.getHealth();
    backendUp = health?.status === 'healthy';
  } catch (error) {
    logger.warn('Backend health check failed', { error: (error as Error).message });
  }

  res.json({
    status: backendUp ? 'healthy' : 'degraded',
    version: '0.0.1',
    layer: 'bff',
    uptime: process.uptime(),
    services: {
      backend: { status: backendUp ? 'up' : 'down' },
    },
  });
});

export default router;
