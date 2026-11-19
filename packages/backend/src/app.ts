import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import mongoose from 'mongoose';
import { config } from './config/index.js';
import { metricsMiddleware, register } from './middleware/metrics.js';
import { errorHandler } from './middleware/errorHandler.js';
import { logger } from './utils/logger.js';
import authRoutes from './routes/auth.routes.js';
import documentRoutes from './routes/document.routes.js';

export function createApp(): express.Express {
  const app = express();

  // Security
  app.use(helmet());
  app.use(cors({ origin: config.corsOrigin, credentials: true }));

  // Body parsing
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true }));

  // Logging
  app.use(morgan('combined', {
    stream: { write: (message: string) => logger.info(message.trim()) },
  }));

  // Metrics
  app.use(metricsMiddleware);

  // Health check
  app.get('/health', async (_req, res) => {
    const mongoStatus = mongoose.connection.readyState === 1;

    res.json({
      status: mongoStatus ? 'healthy' : 'degraded',
      version: '0.0.1',
      uptime: process.uptime(),
      environment: config.nodeEnv,
      services: {
        mongodb: { status: mongoStatus ? 'up' : 'down' },
        ai: { status: 'up' },
      },
    });
  });

  // Metrics endpoint for Prometheus
  app.get('/metrics', async (_req, res) => {
    res.set('Content-Type', register.contentType);
    res.end(await register.metrics());
  });

  // API Routes
  app.use('/api/auth', authRoutes);
  app.use('/api/documents', documentRoutes);

  // Error handling
  app.use(errorHandler);

  return app;
}
