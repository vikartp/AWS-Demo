import { v4 as uuidv4 } from 'uuid';
import {
  DocumentMetadata,
  CreateDocumentRequest,
  UpdateDocumentRequest,
  DocumentQuery,
} from '@documind/shared';
import { DocumentModel, IDocumentDocument } from '../models/document.model.js';
import { IStorageAdapter } from '../adapters/storage/storage.interface.js';
import { LocalStorageAdapter } from '../adapters/storage/local-storage.adapter.js';
import { IQueueAdapter } from '../adapters/queue/queue.interface.js';
import { LocalQueueAdapter } from '../adapters/queue/local-queue.adapter.js';
import { AppError } from '../middleware/errorHandler.js';
import { documentsTotal } from '../middleware/metrics.js';
import { logger } from '../utils/logger.js';

export class DocumentService {
  private storage: IStorageAdapter;
  private queue: IQueueAdapter;

  constructor(storage?: IStorageAdapter, queue?: IQueueAdapter) {
    this.storage = storage || new LocalStorageAdapter();
    this.queue = queue || new LocalQueueAdapter();
  }

  async createDocument(
    userId: string,
    file: Express.Multer.File,
    metadata: CreateDocumentRequest,
  ): Promise<DocumentMetadata> {
    const fileId = uuidv4();
    const sanitizedFilename = file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_');
    const storageKey = `${userId}/${fileId}-${sanitizedFilename}`;

    // 1. Store file in storage adapter
    await this.storage.upload(storageKey, file.buffer, file.mimetype);

    // 2. Create document metadata record in MongoDB
    const doc: IDocumentDocument = await DocumentModel.create({
      userId,
      title: metadata.title.trim(),
      description: metadata.description?.trim(),
      category: metadata.category,
      tags: metadata.tags || [],
      fileName: file.originalname,
      fileSize: file.size,
      mimeType: file.mimetype,
      s3Key: storageKey,
      status: 'processing',
    });

    documentsTotal.inc({ status: 'processing' });
    logger.info(`Document created in database: ${doc.id} (user: ${userId})`);

    // 3. Dispatch async job to queue (simulates SQS in AWS)
    await this.queue.sendMessage({
      jobId: `job-${uuidv4()}`,
      documentId: doc.id,
      userId,
      s3Key: storageKey,
      filePath: `/app/uploads/${storageKey}`,
      mimeType: file.mimetype,
      operation: 'process',
    });

    return doc.toJSON() as unknown as DocumentMetadata;
  }

  async getDocuments(
    userId: string,
    query: DocumentQuery,
  ): Promise<{ documents: DocumentMetadata[]; total: number; page: number; limit: number }> {
    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(query.limit) || 20));
    const skip = (page - 1) * limit;

    const filter: Record<string, unknown> = { userId };

    if (query.category) {
      filter.category = query.category;
    }

    if (query.tag) {
      filter.tags = query.tag;
    }

    if (query.status) {
      filter.status = query.status;
    }

    if (query.search) {
      const regex = new RegExp(query.search.trim(), 'i');
      filter.$or = [{ title: regex }, { description: regex }, { tags: regex }];
    }

    const [docs, total] = await Promise.all([
      DocumentModel.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
      DocumentModel.countDocuments(filter),
    ]);

    return {
      documents: docs.map((d) => d.toJSON() as unknown as DocumentMetadata),
      total,
      page,
      limit,
    };
  }

  async getDocumentById(id: string, userId: string): Promise<DocumentMetadata> {
    const doc = await DocumentModel.findOne({ _id: id, userId });
    if (!doc) {
      throw new AppError(404, 'DOCUMENT_NOT_FOUND', 'Document not found');
    }
    return doc.toJSON() as unknown as DocumentMetadata;
  }

  async updateDocument(
    id: string,
    userId: string,
    updates: UpdateDocumentRequest,
  ): Promise<DocumentMetadata> {
    const doc = await DocumentModel.findOne({ _id: id, userId });
    if (!doc) {
      throw new AppError(404, 'DOCUMENT_NOT_FOUND', 'Document not found');
    }

    if (updates.title !== undefined) doc.title = updates.title.trim();
    if (updates.description !== undefined) doc.description = updates.description.trim();
    if (updates.category !== undefined) doc.category = updates.category;
    if (updates.tags !== undefined) doc.tags = updates.tags;

    await doc.save();
    logger.info(`Document updated: ${id}`);
    return doc.toJSON() as unknown as DocumentMetadata;
  }

  async deleteDocument(id: string, userId: string): Promise<void> {
    const doc = await DocumentModel.findOne({ _id: id, userId });
    if (!doc) {
      throw new AppError(404, 'DOCUMENT_NOT_FOUND', 'Document not found');
    }

    // 1. Delete file from storage
    try {
      await this.storage.delete(doc.s3Key);
    } catch (err) {
      logger.warn(`Failed to delete storage file for doc ${id}: ${(err as Error).message}`);
    }

    // 2. Remove metadata from MongoDB
    await DocumentModel.deleteOne({ _id: id, userId });
    logger.info(`Document deleted: ${id}`);
  }

  async getDocumentFile(id: string, userId: string): Promise<{ buffer: Buffer; fileName: string; mimeType: string }> {
    const doc = await DocumentModel.findOne({ _id: id, userId });
    if (!doc) {
      throw new AppError(404, 'DOCUMENT_NOT_FOUND', 'Document not found');
    }

    const buffer = await this.storage.download(doc.s3Key);
    return {
      buffer,
      fileName: doc.fileName,
      mimeType: doc.mimeType,
    };
  }
}

export const documentService = new DocumentService();
