import { createApp } from './app.js';
import { config } from './config/index.js';
import { logger } from './utils/logger.js';

function main() {
  const app = createApp();

  app.listen(config.port, () => {
    logger.info(`BFF service running on port ${config.port}`);
    logger.info(`Environment: ${config.nodeEnv}`);
    logger.info(`Auth provider: ${config.authProvider}`);
    logger.info(`Backend URL: ${config.backendUrl}`);
    logger.info(`Health: http://localhost:${config.port}/health`);
    logger.info(`Metrics: http://localhost:${config.port}/metrics`);
  });

  const shutdown = (signal: string) => {
    logger.info(`${signal} received. Shutting down...`);
    process.exit(0);
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

main();
