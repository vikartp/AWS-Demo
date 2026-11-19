import mongoose, { Schema, Document } from 'mongoose';
import { User } from '@documind/shared';

export interface IUserDocument extends Omit<User, 'id'>, Document {
  passwordHash?: string;
}

const userSchema = new Schema<IUserDocument>(
  {
    cognitoId: { type: String, required: true, unique: true, index: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    displayName: { type: String, required: true, trim: true },
    passwordHash: { type: String, select: false }, // Hidden by default from queries
  },
  {
    timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' },
    toJSON: {
      virtuals: true,
      transform: (_doc, ret) => {
        const { _id, __v, passwordHash, ...rest } = ret;
        return { id: _id.toString(), ...rest };
      },
    },
  },
);

export const UserModel = mongoose.model<IUserDocument>('User', userSchema);
