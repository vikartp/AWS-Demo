import { IQueueAdapter, QueueMessage } from './queue.interface.js';
import { logger } from '../../utils/logger.js';

/**
 * Local queue adapter that uses an in-process event emitter.
 * In production, this is replaced by SQS.
 * For Phase 2, we keep it simple. In Phase 3, we can add BullMQ + Redis.
 */
export class LocalQueueAdapter implements IQueueAdapter {
  private handlers: Array<(message: QueueMessage) => void> = [];

  onMessage(handler: (message: QueueMessage) => void): void {
    this.handlers.push(handler);
  }

  async sendMessage(message: QueueMessage): Promise<void> {
    logger.info(`[LocalQueue] Message sent: ${message.operation} for doc ${message.documentId}`);

    // Process asynchronously (simulate SQS behavior)
    setTimeout(() => {
      for (const handler of this.handlers) {
        handler(message);
      }
    }, 100);
  }
}
