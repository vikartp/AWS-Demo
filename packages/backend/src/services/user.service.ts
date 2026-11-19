import bcrypt from 'bcryptjs';
import { RegisterRequest, LoginRequest, User } from '@documind/shared';
import { UserModel, IUserDocument } from '../models/user.model.js';
import { AppError } from '../middleware/errorHandler.js';
import { logger } from '../utils/logger.js';

export class UserService {
  async register(data: RegisterRequest): Promise<User> {
    const existing = await UserModel.findOne({ email: data.email.toLowerCase() });
    if (existing) {
      throw new AppError(409, 'USER_EXISTS', 'A user with this email address already exists');
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(data.password, salt);

    const userDoc: IUserDocument = await UserModel.create({
      cognitoId: `local-usr-${Date.now()}`,
      email: data.email.toLowerCase(),
      displayName: data.displayName.trim(),
      passwordHash,
    });

    logger.info(`User registered successfully: ${userDoc.email} (${userDoc.id})`);
    return userDoc.toJSON() as unknown as User;
  }

  async login(data: LoginRequest): Promise<User> {
    const user = await UserModel.findOne({ email: data.email.toLowerCase() }).select('+passwordHash');
    if (!user || !user.passwordHash) {
      throw new AppError(401, 'INVALID_CREDENTIALS', 'Invalid email or password');
    }

    const isMatch = await bcrypt.compare(data.password, user.passwordHash);
    if (!isMatch) {
      throw new AppError(401, 'INVALID_CREDENTIALS', 'Invalid email or password');
    }

    logger.info(`User authenticated: ${user.email} (${user.id})`);
    return user.toJSON() as unknown as User;
  }

  async findById(id: string): Promise<User | null> {
    const user = await UserModel.findById(id);
    return user ? (user.toJSON() as unknown as User) : null;
  }
}

export const userService = new UserService();
