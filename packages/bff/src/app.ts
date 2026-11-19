import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import jwt from 'jsonwebtoken';
import { config } from './config/index.js';
import { metricsMiddleware, register } from './middleware/metrics.js';
import { logger } from './utils/logger.js';
import healthRoutes from './routes/health.js';
import documentRoutes from './routes/documents.js';
import aiRoutes from './routes/ai.js';

export function createApp(): express.Express {
  const app = express();

  app.use(helmet());
  app.use(cors({ origin: config.corsOrigin, credentials: true }));
  app.use(express.json({ limit: '10mb' }));
  app.use(morgan('combined', {
    stream: { write: (message: string) => logger.info(message.trim()) },
  }));
  app.use(metricsMiddleware);

  // Routes
  app.use(healthRoutes);
  app.use('/api/documents', documentRoutes);
  app.use('/api/ai', aiRoutes);

  // Metrics endpoint for Prometheus
  app.get('/metrics', async (_req, res) => {
    res.set('Content-Type', register.contentType);
    res.end(await register.metrics());
  });

  // Auth routes (local dev only) — login to get a JWT token
  if (config.authProvider === 'local') {
    app.post('/api/auth/login', (req, res) => {
      const { email, displayName } = req.body;
      if (!email) {
        res.status(400).json({ success: false, error: { code: 'BAD_REQUEST', message: 'Email required' } });
        return;
      }
      const token = jwt.sign(
        { userId: `local-${Date.now()}`, email, displayName: displayName || email },
        config.jwtSecret,
        { expiresIn: '24h' },
      );
      res.json({ success: true, data: { token, expiresIn: '24h' } });
    });

    app.post('/api/auth/register', (req, res) => {
      const { email, displayName } = req.body;
      if (!email || !displayName) {
        res.status(400).json({ success: false, error: { code: 'BAD_REQUEST', message: 'Email and displayName required' } });
        return;
      }
      const token = jwt.sign(
        { userId: `local-${Date.now()}`, email, displayName },
        config.jwtSecret,
        { expiresIn: '24h' },
      );
      res.json({ success: true, data: { token, user: { email, displayName }, expiresIn: '24h' } });
    });
  }

  return app;
}
