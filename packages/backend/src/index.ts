import mongoose from 'mongoose';
import { createApp } from './app.js';
import { config } from './config/index.js';
import { logger } from './utils/logger.js';

async function main() {
  try {
    // Connect to MongoDB
    logger.info(`Connecting to MongoDB at ${config.mongoUri.replace(/\/\/.*@/, '//***@')}...`);
    await mongoose.connect(config.mongoUri);
    logger.info('Connected to MongoDB');

    // Create and start Express app
    const app = createApp();

    app.listen(config.port, () => {
      logger.info(`Backend service running on port ${config.port}`);
      logger.info(`Environment: ${config.nodeEnv}`);
      logger.info(`AI Provider: ${config.aiProvider}`);
      logger.info(`Storage Provider: ${config.storageProvider}`);
      logger.info(`Health: http://localhost:${config.port}/health`);
      logger.info(`Metrics: http://localhost:${config.port}/metrics`);
    });

    // Graceful shutdown
    const shutdown = async (signal: string) => {
      logger.info(`${signal} received. Shutting down gracefully...`);
      await mongoose.disconnect();
      logger.info('MongoDB disconnected');
      process.exit(0);
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));
  } catch (error) {
    logger.error('Failed to start backend service', { error });
    process.exit(1);
  }
}

main();
