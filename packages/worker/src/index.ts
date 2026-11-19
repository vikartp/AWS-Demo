import express from 'express';
import client from 'prom-client';
import dotenv from 'dotenv';

dotenv.config();

const PORT = parseInt(process.env.PORT || '3004', 10);
const app = express();

// Metrics
const register = new client.Registry();
client.collectDefaultMetrics({ register });

const jobsProcessed = new client.Counter({
  name: 'worker_jobs_processed_total',
  help: 'Total number of jobs processed by the worker',
  labelNames: ['operation', 'status'],
  registers: [register],
});

const jobDuration = new client.Histogram({
  name: 'worker_job_duration_seconds',
  help: 'Duration of job processing in seconds',
  labelNames: ['operation'],
  buckets: [1, 5, 10, 30, 60, 120, 300],
  registers: [register],
});

export { jobsProcessed, jobDuration };

// Health and metrics endpoints
app.get('/health', (_req, res) => {
  res.json({
    status: 'healthy',
    service: 'worker',
    uptime: process.uptime(),
  });
});

app.get('/metrics', async (_req, res) => {
  res.set('Content-Type', register.contentType);
  res.end(await register.metrics());
});

app.listen(PORT, () => {
  console.log(`
╔══════════════════════════════════════════╗
║        DocuMind Background Worker        ║
║                                          ║
║  Metrics: http://localhost:${PORT}/metrics ║
║  Health:  http://localhost:${PORT}/health  ║
║                                          ║
║  Waiting for jobs...                     ║
║  (Job processing added in Phase 3)       ║
╚══════════════════════════════════════════╝
  `);
});
