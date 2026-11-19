import axios, { AxiosInstance } from 'axios';
import { config } from '../config/index.js';
import { logger } from '../utils/logger.js';
import { backendCallDuration } from '../middleware/metrics.js';

/**
 * HTTP client for the BFF to call backend services.
 * Locally: calls Express backend container via Docker networking.
 * On AWS: would invoke Lambda functions directly (or via internal API Gateway).
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
      logger.debug(`Backend call: ${reqConfig.method?.toUpperCase()} ${reqConfig.url}`);
      return reqConfig;
    });
  }

  async getDocuments(userId: string, params?: Record<string, string>) {
    const end = backendCallDuration.startTimer({ service: 'documents', operation: 'list' });
    try {
      const response = await this.client.get('/api/documents', {
        params: { ...params, userId },
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
        params: { userId },
      });
      end();
      return response.data;
    } catch (error) {
      end();
      throw error;
    }
  }

  async getHealth() {
    const response = await this.client.get('/health');
    return response.data;
  }

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
