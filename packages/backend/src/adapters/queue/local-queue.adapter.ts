import { IQueueAdapter, QueueMessage } from './queue.interface.js';
import { config } from '../../config/index.js';
import { logger } from '../../utils/logger.js';

/**
 * Local queue adapter that simulates an SQS -> Lambda trigger.
 * In production AWS, SQS decouples document processing and invokes the Worker Lambda.
 * Locally, this sends an HTTP POST to the worker container asynchronously.
 */
export class LocalQueueAdapter implements IQueueAdapter {
  private workerUrl: string;

  constructor() {
    this.workerUrl = config.workerUrl;
  }

  async sendMessage(message: QueueMessage): Promise<void> {
    logger.info(`[LocalQueue] Dispatching job ${message.jobId} to worker for document ${message.documentId}`);

    // Asynchronously dispatch job without blocking the HTTP response
    setImmediate(async () => {
      try {
        const response = await fetch(`${this.workerUrl}/jobs/process`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(message),
        });

        if (!response.ok) {
          logger.error(`[LocalQueue] Worker rejected job ${message.jobId}: ${response.statusText}`);
        } else {
          logger.info(`[LocalQueue] Worker acknowledged job ${message.jobId}`);
        }
      } catch (error) {
        logger.error(`[LocalQueue] Failed to reach worker at ${this.workerUrl}`, {
          error: (error as Error).message,
        });
      }
    });
  }
}
