import {
  BedrockRuntimeClient,
  ConverseCommand,
  InvokeModelCommand,
  Message,
} from '@aws-sdk/client-bedrock-runtime';
import {
  IAIAdapter,
  SummarizeParams,
  EmbedParams,
  ChatParams,
  AISummarizeResult,
  AIEmbedResult,
  AIChatResult,
} from './ai.interface.js';
import { config } from '../../config/index.js';
import { logger } from '../../utils/logger.js';

/**
 * Real Amazon Bedrock AI Adapter.
 * Communicates with AWS Bedrock Foundation Models via the AWS SDK:
 * - Conversational Q&A / Summarization: Claude 3 Haiku (via Converse API)
 * - Embeddings: Amazon Titan Text Embeddings V2 (via InvokeModel API)
 */
export class BedrockAIAdapter implements IAIAdapter {
  readonly providerName = 'bedrock';
  readonly modelName: string;
  private client: BedrockRuntimeClient;
  private chatModelId: string;
  private embedModelId: string;

  constructor(region = config.awsRegion) {
    this.chatModelId = config.bedrockChatModelId;
    this.embedModelId = config.bedrockEmbedModelId;
    this.modelName = this.chatModelId;

    this.client = new BedrockRuntimeClient({
      region,
    });

    logger.info(`[Bedrock] Initialized BedrockRuntimeClient in region ${region}`);
    logger.info(`[Bedrock] Chat Model: ${this.chatModelId}, Embed Model: ${this.embedModelId}`);
  }

  /**
   * Generates a concise summary using Claude 3 Haiku via Bedrock Converse API.
   */
  async summarize(params: SummarizeParams): Promise<AISummarizeResult> {
    try {
      const systemPrompt =
        'You are an expert technical knowledge assistant. ' +
        'Generate a structured, concise executive summary of the provided text. ' +
        'Highlight core topics, architectural decisions, and key takeaways in bullet points.';

      const command = new ConverseCommand({
        modelId: this.chatModelId,
        system: [{ text: systemPrompt }],
        messages: [
          {
            role: 'user',
            content: [{ text: `Please summarize the following document:\n\n${params.text}` }],
          },
        ],
        inferenceConfig: {
          maxTokens: params.maxLength ? params.maxLength * 4 : 500,
          temperature: 0.2,
          topP: 0.9,
        },
      });

      const response = await this.client.send(command);
      const summary =
        response.output?.message?.content?.[0]?.text || '[Bedrock Summary: No content generated]';

      return {
        summary,
        tokensUsed: {
          input: response.usage?.inputTokens || 0,
          output: response.usage?.outputTokens || 0,
        },
      };
    } catch (error) {
      logger.error('[Bedrock] summarize error:', error);
      throw new Error(`Bedrock Summarization Failed: ${(error as Error).message}`);
    }
  }

  /**
   * Generates vector embeddings using Amazon Titan Text Embeddings V2 (1024 dimensions).
   */
  async embed(params: EmbedParams): Promise<AIEmbedResult> {
    try {
      const payload = {
        inputText: params.text,
        dimensions: 1024,
        normalize: true,
      };

      const command = new InvokeModelCommand({
        modelId: this.embedModelId,
        contentType: 'application/json',
        accept: 'application/json',
        body: Buffer.from(JSON.stringify(payload)),
      });

      const response = await this.client.send(command);
      const responseBody = JSON.parse(new TextDecoder().decode(response.body));

      return {
        embedding: responseBody.embedding,
        tokensUsed: {
          input: responseBody.inputTextTokenCount || Math.ceil(params.text.length / 4),
          output: 0,
        },
      };
    } catch (error) {
      logger.error('[Bedrock] embed error:', error);
      throw new Error(`Bedrock Embedding Failed: ${(error as Error).message}`);
    }
  }

  /**
   * Generates a context-aware answer using Claude 3 Haiku via Bedrock Converse API.
   * Grounded with context snippets retrieved from RAG vector search.
   */
  async chat(params: ChatParams): Promise<AIChatResult> {
    try {
      const systemPrompt =
        'You are DocuMind AI, an enterprise document assistant powered by Amazon Bedrock. ' +
        'Answer the user question based strictly on the provided document context snippets. ' +
        'If the context does not contain enough information to answer, state clearly that ' +
        'the document does not contain that information. Cite relevant document sections.';

      const formattedContext =
        params.context.length > 0
          ? `DOCUMENT CONTEXT SNIPPETS:\n${params.context.map((c, i) => `[Source ${i + 1}]:\n${c}`).join('\n\n')}\n\n`
          : 'No specific document context retrieved.\n\n';

      const promptText = `${formattedContext}USER QUESTION:\n${params.question}`;

      const messages: Message[] = [];

      // Add conversation history if present
      if (params.conversationHistory && params.conversationHistory.length > 0) {
        for (const msg of params.conversationHistory) {
          messages.push({
            role: msg.role === 'assistant' ? 'assistant' : 'user',
            content: [{ text: msg.content }],
          });
        }
      }

      // Add current question with context
      messages.push({
        role: 'user',
        content: [{ text: promptText }],
      });

      const command = new ConverseCommand({
        modelId: this.chatModelId,
        system: [{ text: systemPrompt }],
        messages,
        inferenceConfig: {
          maxTokens: 1000,
          temperature: 0.1,
          topP: 0.9,
        },
      });

      const response = await this.client.send(command);
      const answer =
        response.output?.message?.content?.[0]?.text || '[Bedrock Chat: No response generated]';

      return {
        answer,
        tokensUsed: {
          input: response.usage?.inputTokens || 0,
          output: response.usage?.outputTokens || 0,
        },
      };
    } catch (error) {
      logger.error('[Bedrock] chat error:', error);
      throw new Error(`Bedrock Chat Failed: ${(error as Error).message}`);
    }
  }
}
