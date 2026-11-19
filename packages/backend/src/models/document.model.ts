import mongoose, { Schema, Document as MongoDocument } from 'mongoose';
import { DocumentMetadata } from '@documind/shared';

export interface IDocumentDocument extends Omit<DocumentMetadata, 'id'>, MongoDocument {}

const documentSchema = new Schema<IDocumentDocument>(
  {
    userId: { type: String, required: true, index: true },
    title: { type: String, required: true, trim: true, maxlength: 200 },
    description: { type: String, trim: true, maxlength: 1000 },
    category: { type: String, required: true, index: true },
    tags: { type: [String], default: [], index: true },
    fileName: { type: String, required: true },
    fileSize: { type: Number, required: true },
    mimeType: { type: String, required: true },
    s3Key: { type: String, required: true },
    status: {
      type: String,
      enum: ['uploading', 'processing', 'ready', 'error'],
      default: 'uploading',
      index: true,
    },
    summary: { type: String },
  },
  {
    timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' },
    toJSON: {
      virtuals: true,
      transform: (_doc, ret) => {
        const { _id, __v, ...rest } = ret;
        return { id: _id.toString(), ...rest };
      },
    },
  },
);

// Text index for search
documentSchema.index({ title: 'text', description: 'text', tags: 'text' });

export const DocumentModel = mongoose.model<IDocumentDocument>('Document', documentSchema);
