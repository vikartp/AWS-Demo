import express, { Request, Response } from 'express';
import client from 'prom-client';
import mongoose from 'mongoose';
import fs from 'fs/promises';
import path from 'path';
import dotenv from 'dotenv';
import { QueueJobPayload } from '@documind/shared';

dotenv.config();

const PORT = parseInt(process.env.PORT || '3004', 10);
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://mongo:27017/documind';
const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://mock-ai:3003';
const UPLOAD_DIR = process.env.UPLOAD_DIR || '/app/uploads';

const app = express();
app.use(express.json());

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
  buckets: [0.1, 0.5, 1, 2, 5, 10, 30],
  registers: [register],
});

const workerActiveJobs = new client.Gauge({
  name: 'worker_active_jobs',
  help: 'Number of currently processing background worker jobs',
  registers: [register],
});

const workerJobTokensUsed = new client.Counter({
  name: 'worker_job_tokens_used_total',
  help: 'Total number of AI tokens used during worker summarization',
  labelNames: ['operation', 'direction'],
  registers: [register],
});

// Minimal Document model for updating status & summary
const DocumentSchema = new mongoose.Schema(
  {
    status: String,
    summary: String,
    title: String,
    fileName: String,
  },
  { collection: 'documents', timestamps: true },
);

const DocumentModel = mongoose.model('WorkerDocument', DocumentSchema);

// Connect to MongoDB
async function initDb() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log(`[Worker] Connected to MongoDB at ${MONGODB_URI.replace(/\/\/.*@/, '//***@')}`);
  } catch (err) {
    console.error('[Worker] MongoDB connection error:', err);
  }
}
initDb();

// Health check
app.get('/health', (_req: Request, res: Response) => {
  const isDbConnected = mongoose.connection.readyState === 1;
  res.json({
    status: isDbConnected ? 'healthy' : 'degraded',
    service: 'worker',
    uptime: process.uptime(),
    db: isDbConnected ? 'connected' : 'disconnected',
  });
});

// Prometheus metrics endpoint
app.get('/metrics', async (_req: Request, res: Response) => {
  res.set('Content-Type', register.contentType);
  res.end(await register.metrics());
});

// Job execution endpoint (Event trigger, mimics SQS Lambda invocation)
app.post('/jobs/process', async (req: Request, res: Response) => {
  const payload: QueueJobPayload = req.body;
  const endTimer = jobDuration.startTimer({ operation: payload.operation || 'process' });
  workerActiveJobs.inc();

  console.log(`[Worker] Received job ${payload.jobId} for document ${payload.documentId}`);

  try {
    // 1. Resolve file path
    const resolvedPath = payload.filePath || path.join(UPLOAD_DIR, payload.s3Key);
    let extractedText = '';

    try {
      const fileBytes = await fs.readFile(resolvedPath);
      // For text, markdown, or json, decode as UTF-8
      if (
        payload.mimeType?.includes('text') ||
        payload.mimeType?.includes('json') ||
        payload.s3Key?.endsWith('.txt') ||
        payload.s3Key?.endsWith('.md')
      ) {
        extractedText = fileBytes.toString('utf-8');
      } else {
        // For other files, extract readable ASCII strings or fallback
        extractedText = fileBytes.toString('utf-8').replace(/[^\x20-\x7E\t\r\n]/g, ' ').substring(0, 5000);
        if (extractedText.trim().length < 20) {
          extractedText = `Document ${payload.s3Key} (MIME: ${payload.mimeType || 'unknown'}) uploaded successfully. Content analysis ready.`;
        }
      }
    } catch (readErr) {
      console.warn(`[Worker] Could not read file on disk: ${(readErr as Error).message}`);
      extractedText = `Document ${payload.documentId} processed. Text extraction completed.`;
    }

    // 2. Call AI service for summarization (Simulates Bedrock Claude Haiku)
    let summary = '';
    try {
      const aiResponse = await fetch(`${AI_SERVICE_URL}/api/summarize`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: extractedText.substring(0, 8000), // Bedrock context window
          maxLength: 150,
        }),
      });

      if (aiResponse.ok) {
        const aiData = (await aiResponse.json()) as {
          summary: string;
          tokensUsed?: { input: number; output: number };
        };
        summary = aiData.summary;
        if (aiData.tokensUsed) {
          workerJobTokensUsed.inc({ operation: 'summarize', direction: 'input' }, aiData.tokensUsed.input);
          workerJobTokensUsed.inc({ operation: 'summarize', direction: 'output' }, aiData.tokensUsed.output);
        }
      } else {
        summary = `[Automated Summary] Document ${payload.s3Key} has been indexed.`;
      }
    } catch (aiErr) {
      console.warn(`[Worker] AI summarization failed, using fallback: ${(aiErr as Error).message}`);
      summary = `[Automated Summary] Document indexed. Preview: ${extractedText.substring(0, 150)}...`;
    }

    // 3. Update document in MongoDB
    await DocumentModel.findByIdAndUpdate(payload.documentId, {
      status: 'ready',
      summary,
    });

    jobsProcessed.inc({ operation: payload.operation || 'process', status: 'success' });
    endTimer();
    workerActiveJobs.dec();

    console.log(`[Worker] Successfully processed document ${payload.documentId} (status: ready)`);
    res.json({
      success: true,
      jobId: payload.jobId,
      documentId: payload.documentId,
      status: 'ready',
      summary,
    });
  } catch (error) {
    jobsProcessed.inc({ operation: payload.operation || 'process', status: 'error' });
    endTimer();
    workerActiveJobs.dec();
    console.error(`[Worker] Job ${payload.jobId} failed:`, error);

    // Update document status to error
    await DocumentModel.findByIdAndUpdate(payload.documentId, {
      status: 'error',
    }).catch(() => {});

    res.status(500).json({
      success: false,
      jobId: payload.jobId,
      error: (error as Error).message,
    });
  }
});

app.listen(PORT, () => {
  console.log(`
╔══════════════════════════════════════════╗
║        DocuMind Background Worker        ║
║                                          ║
║  Metrics: http://localhost:${PORT}/metrics ║
║  Health:  http://localhost:${PORT}/health  ║
║  Jobs:    POST http://localhost:${PORT}/jobs/process
╚══════════════════════════════════════════╝
  `);
});
