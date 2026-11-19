// ===== User & Auth Types =====
export interface User {
  id: string;
  cognitoId: string;
  email: string;
  displayName: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface RegisterRequest {
  email: string;
  displayName: string;
  password: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface AuthResponse {
  user: {
    id: string;
    email: string;
    displayName: string;
  };
  token: string;
  expiresIn: string;
}

// ===== Document Types =====
export type DocumentStatus = 'uploading' | 'processing' | 'ready' | 'error';

export interface DocumentMetadata {
  id: string;
  userId: string;
  title: string;
  description?: string;
  category: string;
  tags: string[];
  fileName: string;
  fileSize: number;
  mimeType: string;
  s3Key: string;
  status: DocumentStatus;
  summary?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateDocumentRequest {
  title: string;
  description?: string;
  category: string;
  tags: string[];
}

export interface UpdateDocumentRequest {
  title?: string;
  description?: string;
  category?: string;
  tags?: string[];
}

export interface DocumentQuery {
  search?: string;
  category?: string;
  tag?: string;
  status?: DocumentStatus;
  page?: number;
  limit?: number;
}

// ===== AI Types =====
export interface AskQuestionRequest {
  documentId: string;
  question: string;
}

export interface AskQuestionResponse {
  answer: string;
  sources: Array<{
    chunkText: string;
    score: number;
  }>;
  tokensUsed: {
    input: number;
    output: number;
  };
}

export interface SummarizeRequest {
  documentId: string;
}

export interface SummarizeResponse {
  summary: string;
  tokensUsed: {
    input: number;
    output: number;
  };
}

// ===== Job Types =====
export type JobStatus = 'pending' | 'summarizing' | 'embedding' | 'completed' | 'failed';

export interface Job {
  jobId: string;
  userId: string;
  documentId: string;
  status: JobStatus;
  error?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface QueueJobPayload {
  jobId: string;
  documentId: string;
  userId: string;
  filePath: string;
  s3Key: string;
  mimeType: string;
  operation: 'summarize' | 'embed' | 'process';
}

// ===== Conversation Types =====
export interface ConversationMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  tokensUsed?: {
    input: number;
    output: number;
  };
}

export interface Conversation {
  id: string;
  userId: string;
  documentId: string;
  messages: ConversationMessage[];
  createdAt: Date;
  updatedAt: Date;
}

// ===== API Response Types =====
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: unknown;
  };
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
    totalPages?: number;
  };
}

// ===== Search Types =====
export interface SearchQuery {
  query: string;
  category?: string;
  tags?: string[];
  page?: number;
  limit?: number;
}

// ===== Health Types =====
export interface HealthCheckResponse {
  status: 'healthy' | 'degraded' | 'unhealthy';
  version: string;
  uptime: number;
  services: Record<string, {
    status: 'up' | 'down';
    latencyMs?: number;
  }>;
}
