import mongoose, { Schema, Document } from 'mongoose';
import { Conversation } from '@documind/shared';

export interface IConversationDocument extends Omit<Conversation, 'id'>, Document {}

const conversationSchema = new Schema<IConversationDocument>(
  {
    userId: { type: String, required: true, index: true },
    documentId: { type: String, required: true, index: true },
    messages: [
      {
        role: { type: String, enum: ['user', 'assistant'], required: true },
        content: { type: String, required: true },
        timestamp: { type: Date, default: Date.now },
        tokensUsed: {
          input: { type: Number },
          output: { type: Number },
        },
      },
    ],
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

export const ConversationModel = mongoose.model<IConversationDocument>('Conversation', conversationSchema);
