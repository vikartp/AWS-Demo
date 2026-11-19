export interface QueueMessage {
  jobId: string;
  documentId: string;
  userId: string;
  s3Key: string;
  operation: 'summarize' | 'embed' | 'process';
}

export interface IQueueAdapter {
  sendMessage(message: QueueMessage): Promise<void>;
}
