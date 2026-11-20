import mongoose, { Schema, Document as MongoDocument } from 'mongoose';

export interface IDocumentChunkDocument extends MongoDocument {
  documentId: string;
  userId: string;
  chunkIndex: number;
  text: string;
  embedding: number[];
  tokenCount: number;
  metadata?: Record<string, unknown>;
  createdAt: Date;
}

const documentChunkSchema = new Schema<IDocumentChunkDocument>(
  {
    documentId: { type: String, required: true, index: true },
    userId: { type: String, required: true, index: true },
    chunkIndex: { type: Number, required: true },
    text: { type: String, required: true },
    embedding: { type: [Number], required: true },
    tokenCount: { type: Number, default: 0 },
    metadata: { type: Schema.Types.Mixed, default: {} },
  },
  {
    timestamps: { createdAt: 'createdAt', updatedAt: false },
    collection: 'document_chunks',
  },
);

// Compound index for querying all chunks of a document ordered by index
documentChunkSchema.index({ documentId: 1, chunkIndex: 1 });
documentChunkSchema.index({ userId: 1 });

export const DocumentChunkModel = mongoose.model<IDocumentChunkDocument>(
  'DocumentChunk',
  documentChunkSchema,
);
