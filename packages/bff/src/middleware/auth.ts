import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config/index.js';
import { logger } from '../utils/logger.js';

export interface AuthenticatedRequest extends Request {
  user?: {
    userId: string;
    email: string;
    displayName: string;
  };
}

/**
 * Local auth middleware using JWT.
 * In AWS, this will be replaced by Cognito JWT validation.
 * The BFF validates auth tokens so backend services don't have to.
 */
export function authMiddleware(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): void {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({
      success: false,
      error: { code: 'UNAUTHORIZED', message: 'Missing or invalid authorization header' },
    });
    return;
  }

  const token = authHeader.split(' ')[1];

  try {
    if (config.authProvider === 'local') {
      const decoded = jwt.verify(token, config.jwtSecret) as {
        userId: string;
        email: string;
        displayName: string;
      };

      req.user = {
        userId: decoded.userId,
        email: decoded.email,
        displayName: decoded.displayName,
      };
    } else {
      // Cognito validation will be implemented in Phase 6
      throw new Error('Cognito auth not yet implemented');
    }

    next();
  } catch (error) {
    logger.warn('Auth failed', { error: (error as Error).message });
    res.status(401).json({
      success: false,
      error: { code: 'UNAUTHORIZED', message: 'Invalid or expired token' },
    });
  }
}
