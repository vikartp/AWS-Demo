import { Router } from 'express';
import { AuthenticatedRequest, authMiddleware } from '../middleware/auth.js';
import { backendClient } from '../services/backend.client.js';

const router = Router();

/**
 * BFF document routes.
 * These aggregate and transform backend responses for the frontend.
 * Auth is validated here so backend services trust the userId.
 */
router.get('/', authMiddleware, async (req: AuthenticatedRequest, res, next) => {
  try {
    const params: Record<string, string> = {};
    for (const [key, val] of Object.entries(req.query)) {
      if (typeof val === 'string') params[key] = val;
    }
    const result = await backendClient.getDocuments(req.user!.userId, params);
    res.json(result);
  } catch (error) {
    next(error);
  }
});

router.get('/:id', authMiddleware, async (req: AuthenticatedRequest, res, next) => {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const result = await backendClient.getDocument(id, req.user!.userId);
    res.json(result);
  } catch (error) {
    next(error);
  }
});

export default router;
