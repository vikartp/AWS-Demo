import fs from 'fs/promises';
import path from 'path';
import { IStorageAdapter } from './storage.interface.js';
import { config } from '../../config/index.js';
import { logger } from '../../utils/logger.js';

export class LocalStorageAdapter implements IStorageAdapter {
  private basePath: string;

  constructor() {
    this.basePath = config.uploadDir;
  }

  async upload(key: string, data: Buffer, _mimeType: string): Promise<string> {
    const filePath = path.join(this.basePath, key);
    await fs.mkdir(path.dirname(filePath), { recursive: true });
    await fs.writeFile(filePath, data);
    logger.debug(`File uploaded locally: ${key}`);
    return key;
  }

  async download(key: string): Promise<Buffer> {
    const filePath = path.join(this.basePath, key);
    return fs.readFile(filePath);
  }

  async delete(key: string): Promise<void> {
    const filePath = path.join(this.basePath, key);
    await fs.unlink(filePath);
    logger.debug(`File deleted locally: ${key}`);
  }

  async getSignedUrl(key: string): Promise<string> {
    // Locally, return a direct path
    return `/uploads/${key}`;
  }
}
