import { Router, Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config/index.js';
import { backendClient } from '../services/backend.client.js';
import { authMiddleware, AuthenticatedRequest } from '../middleware/auth.js';
import { ApiResponse, AuthResponse, User } from '@documind/shared';

const router = Router();

// Register new user
router.post('/register', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, displayName, password } = req.body;
    if (!email || !displayName || !password) {
      res.status(400).json({
        success: false,
        error: { code: 'BAD_REQUEST', message: 'Email, displayName, and password are required' },
      });
      return;
    }

    // Call backend service to create user
    const backendResult = await backendClient.register({ email, displayName, password });
    const user: User = backendResult.data;

    // Issue JWT token (simulates Cognito ID/Access token)
    const token = jwt.sign(
      { userId: user.id, email: user.email, displayName: user.displayName },
      config.jwtSecret,
      { expiresIn: '24h' },
    );

    const response: ApiResponse<AuthResponse> = {
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          displayName: user.displayName,
        },
        token,
        expiresIn: '24h',
      },
    };
    res.status(201).json(response);
  } catch (error: any) {
    if (error.response) {
      res.status(error.response.status).json(error.response.data);
    } else {
      next(error);
    }
  }
});

// Login
router.post('/login', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      res.status(400).json({
        success: false,
        error: { code: 'BAD_REQUEST', message: 'Email and password are required' },
      });
      return;
    }

    // Call backend to authenticate
    const backendResult = await backendClient.login({ email, password });
    const user: User = backendResult.data;

    // Issue JWT
    const token = jwt.sign(
      { userId: user.id, email: user.email, displayName: user.displayName },
      config.jwtSecret,
      { expiresIn: '24h' },
    );

    const response: ApiResponse<AuthResponse> = {
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          displayName: user.displayName,
        },
        token,
        expiresIn: '24h',
      },
    };
    res.json(response);
  } catch (error: any) {
    if (error.response) {
      res.status(error.response.status).json(error.response.data);
    } else {
      next(error);
    }
  }
});

// Get current user profile (JWT protected)
router.get('/me', authMiddleware, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const backendResult = await backendClient.getMe(req.user!.userId);
    res.json(backendResult);
  } catch (error: any) {
    if (error.response) {
      res.status(error.response.status).json(error.response.data);
    } else {
      next(error);
    }
  }
});

export default router;
