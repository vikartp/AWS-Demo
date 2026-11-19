import { Router, Request, Response, NextFunction } from 'express';
import { userService } from '../services/user.service.js';
import { ApiResponse, User } from '@documind/shared';

const router = Router();

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

    const user = await userService.register({ email, displayName, password });
    const response: ApiResponse<User> = {
      success: true,
      data: user,
    };
    res.status(201).json(response);
  } catch (error) {
    next(error);
  }
});

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

    const user = await userService.login({ email, password });
    const response: ApiResponse<User> = {
      success: true,
      data: user,
    };
    res.json(response);
  } catch (error) {
    next(error);
  }
});

router.get('/me', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.headers['x-user-id'] as string;
    if (!userId) {
      res.status(401).json({
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'Missing user identification' },
      });
      return;
    }

    const user = await userService.findById(userId);
    if (!user) {
      res.status(404).json({
        success: false,
        error: { code: 'USER_NOT_FOUND', message: 'User not found' },
      });
      return;
    }

    const response: ApiResponse<User> = {
      success: true,
      data: user,
    };
    res.json(response);
  } catch (error) {
    next(error);
  }
});

export default router;
