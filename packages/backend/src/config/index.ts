import dotenv from 'dotenv';
dotenv.config();

export const config = {
  port: parseInt(process.env.PORT || '3001', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  mongoUri: process.env.MONGODB_URI || 'mongodb://mongo:27017/documind',
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  uploadDir: process.env.UPLOAD_DIR || '/tmp/uploads',

  // AI service config (mock in local, Bedrock in AWS)
  aiServiceUrl: process.env.AI_SERVICE_URL || 'http://mock-ai:3003',
  aiProvider: (process.env.AI_PROVIDER || 'mock') as 'mock' | 'bedrock',
  awsRegion: process.env.AWS_REGION || 'us-east-1',
  bedrockChatModelId: process.env.BEDROCK_CHAT_MODEL_ID || 'anthropic.claude-3-haiku-20240307-v1:0',
  bedrockEmbedModelId: process.env.BEDROCK_EMBED_MODEL_ID || 'amazon.titan-embed-text-v2:0',

  // Storage config
  storageProvider: (process.env.STORAGE_PROVIDER || 'local') as 'local' | 's3',
  s3Bucket: process.env.S3_BUCKET || '',
  s3Region: process.env.S3_REGION || 'us-east-1',

  // Queue config
  queueProvider: (process.env.QUEUE_PROVIDER || 'local') as 'local' | 'sqs',
  workerUrl: process.env.WORKER_URL || 'http://worker:3004',
} as const;
