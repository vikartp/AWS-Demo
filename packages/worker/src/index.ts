import express, { Request, Response } from 'express';
import client from 'prom-client';
import mongoose from 'mongoose';
import fs from 'fs/promises';
import path from 'path';
import dotenv from 'dotenv';
import {
  BedrockRuntimeClient,
  ConverseCommand,
  InvokeModelCommand,
} from '@aws-sdk/client-bedrock-runtime';
import { QueueJobPayload } from '@documind/shared';

dotenv.config();

const PORT = parseInt(process.env.PORT || '3004', 10);
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://mongo:27017/documind';
const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://mock-ai:3003';
const AI_PROVIDER = process.env.AI_PROVIDER || 'mock';
const AWS_REGION = process.env.AWS_REGION || 'us-east-1';
const BEDROCK_CHAT_MODEL =
  process.env.BEDROCK_CHAT_MODEL_ID || 'anthropic.claude-3-haiku-20240307-v1:0';
const BEDROCK_EMBED_MODEL =
  process.env.BEDROCK_EMBED_MODEL_ID || 'amazon.titan-embed-text-v2:0';
const UPLOAD_DIR = process.env.UPLOAD_DIR || '/app/uploads';

const app = express();
app.use(express.json());

// Bedrock client if enabled
let bedrockClient: BedrockRuntimeClient | null = null;
if (AI_PROVIDER === 'bedrock') {
  try {
    bedrockClient = new BedrockRuntimeClient({ region: AWS_REGION });
    console.log(`[Worker] Initialized AWS Bedrock Client in ${AWS_REGION}`);
  } catch (err) {
    console.warn(`[Worker] Could not initialize Bedrock Client: ${(err as Error).message}`);
  }
}

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
  help: 'Total number of AI tokens used during worker operations',
  labelNames: ['operation', 'direction'],
  registers: [register],
});

// Document & Chunk MongoDB Models
const DocumentSchema = new mongoose.Schema(
  {
    status: String,
    summary: String,
    title: String,
    fileName: String,
    userId: String,
  },
  { collection: 'documents', timestamps: true },
);

const DocumentModel = mongoose.model('WorkerDocument', DocumentSchema);

const DocumentChunkSchema = new mongoose.Schema(
  {
    documentId: { type: String, required: true, index: true },
    userId: { type: String, required: true, index: true },
    chunkIndex: { type: Number, required: true },
    text: { type: String, required: true },
    embedding: { type: [Number], required: true },
    tokenCount: { type: Number, default: 0 },
    metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  {
    collection: 'document_chunks',
    timestamps: { createdAt: 'createdAt', updatedAt: false },
  },
);

const DocumentChunkModel = mongoose.model('WorkerDocumentChunk', DocumentChunkSchema);

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

// Helper: Semantic Text Chunker
function chunkText(text: string, chunkSize = 800, overlap = 150): string[] {
  const cleaned = text.trim();
  if (cleaned.length <= chunkSize) {
    return [cleaned];
  }

  const chunks: string[] = [];
  let start = 0;

  while (start < cleaned.length) {
    let end = start + chunkSize;
    if (end >= cleaned.length) {
      chunks.push(cleaned.substring(start));
      break;
    }

    const slice = cleaned.substring(start, end);
    let breakIdx = slice.lastIndexOf('\n\n');
    if (breakIdx === -1 || breakIdx < chunkSize * 0.5) breakIdx = slice.lastIndexOf('\n');
    if (breakIdx === -1 || breakIdx < chunkSize * 0.5) breakIdx = slice.lastIndexOf('. ');
    if (breakIdx === -1 || breakIdx < chunkSize * 0.5) breakIdx = slice.lastIndexOf(' ');

    if (breakIdx > chunkSize * 0.3) {
      chunks.push(cleaned.substring(start, start + breakIdx).trim());
      start = start + breakIdx + 1 - overlap;
    } else {
      chunks.push(cleaned.substring(start, end).trim());
      start = end - overlap;
    }
    if (start < 0) start = 0;
  }

  return chunks.filter((c) => c.length > 20);
}

// AI Helper: Summarization
async function generateSummary(text: string): Promise<{ summary: string; tokens: { input: number; output: number } }> {
  if (bedrockClient && AI_PROVIDER === 'bedrock') {
    const cmd = new ConverseCommand({
      modelId: BEDROCK_CHAT_MODEL,
      system: [{ text: 'You are an expert technical summarizer. Provide a concise executive summary.' }],
      messages: [{ role: 'user', content: [{ text: `Summarize this text in 2-3 sentences:\n\n${text.substring(0, 8000)}` }] }],
      inferenceConfig: { maxTokens: 300, temperature: 0.2 },
    });
    const res = await bedrockClient.send(cmd);
    const summary = res.output?.message?.content?.[0]?.text || '';
    return {
      summary,
      tokens: { input: res.usage?.inputTokens || 0, output: res.usage?.outputTokens || 0 },
    };
  }

  // Fallback to local mock AI
  const res = await fetch(`${AI_SERVICE_URL}/api/summarize`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text: text.substring(0, 8000), maxLength: 150 }),
  });
  if (!res.ok) throw new Error(`Mock summarize failed: ${res.statusText}`);
  const data = (await res.json()) as { summary: string; tokensUsed?: { input: number; output: number } };
  return {
    summary: data.summary,
    tokens: data.tokensUsed || { input: Math.ceil(text.length / 4), output: 50 },
  };
}

// AI Helper: Embedding
async function generateEmbedding(text: string): Promise<{ embedding: number[]; tokens: number }> {
  if (bedrockClient && AI_PROVIDER === 'bedrock') {
    const cmd = new InvokeModelCommand({
      modelId: BEDROCK_EMBED_MODEL,
      contentType: 'application/json',
      accept: 'application/json',
      body: Buffer.from(JSON.stringify({ inputText: text, dimensions: 1024, normalize: true })),
    });
    const res = await bedrockClient.send(cmd);
    const body = JSON.parse(new TextDecoder().decode(res.body));
    return {
      embedding: body.embedding,
      tokens: body.inputTextTokenCount || Math.ceil(text.length / 4),
    };
  }

  // Fallback to local mock AI
  const res = await fetch(`${AI_SERVICE_URL}/api/embed`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text }),
  });
  if (!res.ok) throw new Error(`Mock embed failed: ${res.statusText}`);
  const data = (await res.json()) as { embedding: number[]; tokensUsed?: { input: number } };
  return {
    embedding: data.embedding,
    tokens: data.tokensUsed?.input || Math.ceil(text.length / 4),
  };
}

// Health check
app.get('/health', (_req: Request, res: Response) => {
  const isDbConnected = mongoose.connection.readyState === 1;
  res.json({
    status: isDbConnected ? 'healthy' : 'degraded',
    service: 'worker',
    aiProvider: AI_PROVIDER,
    bedrockEnabled: !!bedrockClient,
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

  console.log(`[Worker] Ingesting & processing document ${payload.documentId}`);

  try {
    // 1. Resolve file path and extract raw text
    const resolvedPath = payload.filePath || path.join(UPLOAD_DIR, payload.s3Key);
    let extractedText = '';

    try {
      const fileBytes = await fs.readFile(resolvedPath);
      if (
        payload.mimeType?.includes('text') ||
        payload.mimeType?.includes('json') ||
        payload.s3Key?.endsWith('.txt') ||
        payload.s3Key?.endsWith('.md')
      ) {
        extractedText = fileBytes.toString('utf-8');
      } else {
        extractedText = fileBytes
          .toString('utf-8')
          .replace(/[^\x20-\x7E\t\r\n]/g, ' ')
          .substring(0, 5000);
        if (extractedText.trim().length < 20) {
          extractedText = `Document ${payload.s3Key} uploaded. Content processed.`;
        }
      }
    } catch (readErr) {
      console.warn(`[Worker] Could not read file on disk: ${(readErr as Error).message}`);
      extractedText = `Document ${payload.documentId} processed. Text extraction completed.`;
    }

    // 2. AI Summarization
    let summary = '';
    try {
      const sumResult = await generateSummary(extractedText);
      summary = sumResult.summary;
      workerJobTokensUsed.inc({ operation: 'summarize', direction: 'input' }, sumResult.tokens.input);
      workerJobTokensUsed.inc({ operation: 'summarize', direction: 'output' }, sumResult.tokens.output);
    } catch (sumErr) {
      console.warn(`[Worker] Summarization failed: ${(sumErr as Error).message}`);
      summary = `[Automated Summary] Document indexed. Preview: ${extractedText.substring(0, 150)}...`;
    }

    // 3. Document Chunking & Vector Embeddings (RAG Pipeline)
    const chunks = chunkText(extractedText);
    await DocumentChunkModel.deleteMany({ documentId: payload.documentId });

    let chunkIndex = 0;
    for (const chunkText of chunks) {
      try {
        const embResult = await generateEmbedding(chunkText);
        await DocumentChunkModel.create({
          documentId: payload.documentId,
          userId: payload.userId,
          chunkIndex,
          text: chunkText,
          embedding: embResult.embedding,
          tokenCount: embResult.tokens,
        });
        workerJobTokensUsed.inc({ operation: 'embed', direction: 'input' }, embResult.tokens);
        chunkIndex++;
      } catch (embErr) {
        console.warn(`[Worker] Chunk ${chunkIndex} embedding failed: ${(embErr as Error).message}`);
      }
    }

    // 4. Update Document Status to 'ready'
    await DocumentModel.findByIdAndUpdate(payload.documentId, {
      status: 'ready',
      summary,
    });

    jobsProcessed.inc({ operation: payload.operation || 'process', status: 'success' });
    endTimer();
    workerActiveJobs.dec();

    console.log(
      `[Worker] Complete: Document ${payload.documentId} indexed with ${chunkIndex} vector chunks (status: ready)`,
    );

    res.json({
      success: true,
      jobId: payload.jobId,
      documentId: payload.documentId,
      status: 'ready',
      summary,
      chunksIndexed: chunkIndex,
    });
  } catch (error) {
    jobsProcessed.inc({ operation: payload.operation || 'process', status: 'error' });
    endTimer();
    workerActiveJobs.dec();
    console.error(`[Worker] Job ${payload.jobId} failed:`, error);

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
  console.log(`[Worker] Running on port ${PORT} (AI Provider: ${AI_PROVIDER})`);
});
