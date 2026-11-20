import { Router } from 'express';
import { AuthenticatedRequest, authMiddleware } from '../middleware/auth.js';
import { backendClient } from '../services/backend.client.js';

const router = Router();

router.get('/info', async (_req, res, next) => {
  try {
    const result = await backendClient.getAiInfo();
    res.json(result);
  } catch (error) {
    next(error);
  }
});

router.post('/ask', authMiddleware, async (req: AuthenticatedRequest, res, next) => {
  try {
    const { documentId, question } = req.body;
    const result = await backendClient.askQuestion(documentId, question, req.user!.userId);
    res.json(result);
  } catch (error) {
    next(error);
  }
});

export default router;
