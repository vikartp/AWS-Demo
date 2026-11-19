import axios, { AxiosInstance } from 'axios';
import FormData from 'form-data';
import { config } from '../config/index.js';
import { logger } from '../utils/logger.js';
import { backendCallDuration } from '../middleware/metrics.js';
import { RegisterRequest, LoginRequest, UpdateDocumentRequest } from '@documind/shared';

/**
 * HTTP client for the BFF to communicate with internal backend services.
 * In AWS, this would invoke Lambda functions directly (via AWS SDK) or through internal API Gateway.
 * Locally, it communicates over Docker internal DNS (http://backend:3001).
 */
export class BackendClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: config.backendUrl,
      timeout: 30000,
      headers: { 'Content-Type': 'application/json' },
    });

    this.client.interceptors.request.use((reqConfig) => {
      logger.debug(`[BFF -> Backend] ${reqConfig.method?.toUpperCase()} ${reqConfig.url}`);
      return reqConfig;
    });
  }

  // ===== Auth Services =====
  async register(data: RegisterRequest) {
    const end = backendCallDuration.startTimer({ service: 'auth', operation: 'register' });
    try {
      const response = await this.client.post('/api/auth/register', data);
      end();
      return response.data;
    } catch (error) {
      end();
      throw error;
    }
  }

  async login(data: LoginRequest) {
    const end = backendCallDuration.startTimer({ service: 'auth', operation: 'login' });
    try {
      const response = await this.client.post('/api/auth/login', data);
      end();
      return response.data;
    } catch (error) {
      end();
      throw error;
    }
  }

  async getMe(userId: string) {
    const end = backendCallDuration.startTimer({ service: 'auth', operation: 'me' });
    try {
      const response = await this.client.get('/api/auth/me', {
        headers: { 'x-user-id': userId },
      });
      end();
      return response.data;
    } catch (error) {
      end();
      throw error;
    }
  }

  // ===== Document Services =====
  async uploadDocument(userId: string, formData: FormData) {
    const end = backendCallDuration.startTimer({ service: 'documents', operation: 'upload' });
    try {
      const response = await this.client.post('/api/documents/upload', formData, {
        headers: {
          ...formData.getHeaders(),
          'x-user-id': userId,
        },
      });
      end();
      return response.data;
    } catch (error) {
      end();
      throw error;
    }
  }

  async getDocuments(userId: string, params?: Record<string, string>) {
    const end = backendCallDuration.startTimer({ service: 'documents', operation: 'list' });
    try {
      const response = await this.client.get('/api/documents', {
        params,
        headers: { 'x-user-id': userId },
      });
      end();
      return response.data;
    } catch (error) {
      end();
      throw error;
    }
  }

  async getDocument(documentId: string, userId: string) {
    const end = backendCallDuration.startTimer({ service: 'documents', operation: 'get' });
    try {
      const response = await this.client.get(`/api/documents/${documentId}`, {
        headers: { 'x-user-id': userId },
      });
      end();
      return response.data;
    } catch (error) {
      end();
      throw error;
    }
  }

  async updateDocument(documentId: string, userId: string, updates: UpdateDocumentRequest) {
    const end = backendCallDuration.startTimer({ service: 'documents', operation: 'update' });
    try {
      const response = await this.client.put(`/api/documents/${documentId}`, updates, {
        headers: { 'x-user-id': userId },
      });
      end();
      return response.data;
    } catch (error) {
      end();
      throw error;
    }
  }

  async deleteDocument(documentId: string, userId: string) {
    const end = backendCallDuration.startTimer({ service: 'documents', operation: 'delete' });
    try {
      const response = await this.client.delete(`/api/documents/${documentId}`, {
        headers: { 'x-user-id': userId },
      });
      end();
      return response.data;
    } catch (error) {
      end();
      throw error;
    }
  }

  async downloadDocument(documentId: string, userId: string) {
    const end = backendCallDuration.startTimer({ service: 'documents', operation: 'download' });
    try {
      const response = await this.client.get(`/api/documents/${documentId}/download`, {
        headers: { 'x-user-id': userId },
        responseType: 'arraybuffer',
      });
      end();
      return response;
    } catch (error) {
      end();
      throw error;
    }
  }

  // ===== Health Check =====
  async getHealth() {
    const response = await this.client.get('/health');
    return response.data;
  }

  // ===== AI Services =====
  async askQuestion(documentId: string, question: string, userId: string) {
    const end = backendCallDuration.startTimer({ service: 'ai', operation: 'ask' });
    try {
      const response = await this.client.post('/api/ai/ask', {
        documentId,
        question,
        userId,
      });
      end();
      return response.data;
    } catch (error) {
      end();
      throw error;
    }
  }
}

export const backendClient = new BackendClient();
