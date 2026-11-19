import { Request, Response, NextFunction } from 'express';
import client from 'prom-client';

export const register = new client.Registry();
client.collectDefaultMetrics({ register });

export const httpRequestDuration = new client.Histogram({
  name: 'bff_http_request_duration_seconds',
  help: 'Duration of BFF HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.01, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10],
  registers: [register],
});

export const httpRequestTotal = new client.Counter({
  name: 'bff_http_requests_total',
  help: 'Total number of BFF HTTP requests',
  labelNames: ['method', 'route', 'status_code'],
  registers: [register],
});

export const backendCallDuration = new client.Histogram({
  name: 'bff_backend_call_duration_seconds',
  help: 'Duration of calls from BFF to backend services',
  labelNames: ['service', 'operation'],
  buckets: [0.01, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5],
  registers: [register],
});

export function metricsMiddleware(req: Request, res: Response, next: NextFunction): void {
  const end = httpRequestDuration.startTimer();

  res.on('finish', () => {
    const labels = {
      method: req.method,
      route: req.route?.path || req.path,
      status_code: res.statusCode.toString(),
    };
    end(labels);
    httpRequestTotal.inc(labels);
  });

  next();
}
