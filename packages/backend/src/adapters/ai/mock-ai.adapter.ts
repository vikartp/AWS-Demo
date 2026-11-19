import { IAIAdapter, SummarizeParams, EmbedParams, ChatParams, AISummarizeResult, AIEmbedResult, AIChatResult } from './ai.interface.js';
import { config } from '../../config/index.js';
import { logger } from '../../utils/logger.js';

/**
 * Mock AI adapter that calls a local mock-ai service.
 * This is NOT Amazon Bedrock. It returns canned/simulated responses
 * for local development and testing purposes only.
 */
export class MockAIAdapter implements IAIAdapter {
  private baseUrl: string;

  constructor() {
    this.baseUrl = config.aiServiceUrl;
    logger.info('Using MOCK AI adapter - not connected to Amazon Bedrock');
  }

  async summarize(params: SummarizeParams): Promise<AISummarizeResult> {
    const response = await fetch(`${this.baseUrl}/api/summarize`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });

    if (!response.ok) {
      throw new Error(`Mock AI summarize failed: ${response.statusText}`);
    }

    return response.json() as Promise<AISummarizeResult>;
  }

  async embed(params: EmbedParams): Promise<AIEmbedResult> {
    const response = await fetch(`${this.baseUrl}/api/embed`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });

    if (!response.ok) {
      throw new Error(`Mock AI embed failed: ${response.statusText}`);
    }

    return response.json() as Promise<AIEmbedResult>;
  }

  async chat(params: ChatParams): Promise<AIChatResult> {
    const response = await fetch(`${this.baseUrl}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });

    if (!response.ok) {
      throw new Error(`Mock AI chat failed: ${response.statusText}`);
    }

    return response.json() as Promise<AIChatResult>;
  }
}
