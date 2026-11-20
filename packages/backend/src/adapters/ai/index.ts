import { IAIAdapter } from './ai.interface.js';
import { MockAIAdapter } from './mock-ai.adapter.js';
import { BedrockAIAdapter } from './bedrock.adapter.js';
import { config } from '../../config/index.js';
import { logger } from '../../utils/logger.js';

export * from './ai.interface.js';
export * from './mock-ai.adapter.js';
export * from './bedrock.adapter.js';

let adapterInstance: IAIAdapter | null = null;

/**
 * Returns the configured AI adapter (Mock or Bedrock).
 * Defaults to MockAIAdapter for local development.
 * Switches to BedrockAIAdapter when AI_PROVIDER=bedrock is configured.
 */
export function getAIAdapter(): IAIAdapter {
  if (adapterInstance) {
    return adapterInstance;
  }

  if (config.aiProvider === 'bedrock') {
    try {
      logger.info('[AI] AI_PROVIDER=bedrock: Attempting to initialize Amazon Bedrock adapter...');
      adapterInstance = new BedrockAIAdapter(config.awsRegion);
    } catch (err) {
      logger.warn(
        `[AI] Failed to initialize BedrockAIAdapter: ${(err as Error).message}. Falling back to MockAIAdapter for local stability.`,
      );
      adapterInstance = new MockAIAdapter();
    }
  } else {
    logger.info('[AI] AI_PROVIDER=mock: Using MockAIAdapter (Local development simulation)');
    adapterInstance = new MockAIAdapter();
  }

  return adapterInstance;
}
