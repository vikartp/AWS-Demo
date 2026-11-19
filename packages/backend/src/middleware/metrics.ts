import { Request, Response, NextFunction } from 'express';
import client from 'prom-client';

// Create a Registry
export const register = new client.Registry();

// Add default metrics (CPU, memory, etc.)
client.collectDefaultMetrics({ register });

// Custom metrics
export const httpRequestDuration = new client.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.01, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10],
  registers: [register],
});

export const httpRequestTotal = new client.Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status_code'],
  registers: [register],
});

export const httpErrorTotal = new client.Counter({
  name: 'http_errors_total',
  help: 'Total number of HTTP errors',
  labelNames: ['method', 'route', 'status_code'],
  registers: [register],
});

// AI-specific metrics
export const aiRequestDuration = new client.Histogram({
  name: 'ai_request_duration_seconds',
  help: 'Duration of AI/Bedrock requests in seconds',
  labelNames: ['operation', 'model'],
  buckets: [0.5, 1, 2.5, 5, 10, 30],
  registers: [register],
});

export const aiRequestTotal = new client.Counter({
  name: 'ai_requests_total',
  help: 'Total number of AI requests',
  labelNames: ['operation', 'model', 'status'],
  registers: [register],
});

export const aiTokensUsed = new client.Counter({
  name: 'ai_tokens_used_total',
  help: 'Total number of AI tokens used',
  labelNames: ['operation', 'model', 'direction'],
  registers: [register],
});

// Document metrics
export const documentsTotal = new client.Gauge({
  name: 'documents_total',
  help: 'Total number of documents',
  labelNames: ['status'],
  registers: [register],
});

// Middleware
export function metricsMiddleware(req: Request, res: Response, next: NextFunction): void {
  const end = httpRequestDuration.startTimer();

  res.on('finish', () => {
    const route = req.route?.path || req.path;
    const labels = {
      method: req.method,
      route,
      status_code: res.statusCode.toString(),
    };

    end(labels);
    httpRequestTotal.inc(labels);

    if (res.statusCode >= 400) {
      httpErrorTotal.inc(labels);
    }
  });

  next();
}
