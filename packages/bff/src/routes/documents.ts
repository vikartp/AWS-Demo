import { Router, Response, NextFunction } from 'express';
import multer from 'multer';
import FormData from 'form-data';
import { AuthenticatedRequest, authMiddleware } from '../middleware/auth.js';
import { backendClient } from '../services/backend.client.js';
import { MAX_FILE_SIZE_BYTES } from '@documind/shared';

const router = Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_FILE_SIZE_BYTES },
});

function getParamId(req: AuthenticatedRequest): string {
  return Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
}

/**
 * BFF Document Routes
 * All routes require authentication via JWT. The BFF:
 * 1. Validates the JWT token.
 * 2. Injects user context (userId).
 * 3. Aggregates and proxies calls to the backend service.
 */

// Upload document (multipart form forwarding)
router.post(
  '/upload',
  authMiddleware,
  upload.single('file'),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.file) {
        res.status(400).json({ success: false, error: { code: 'BAD_REQUEST', message: 'No file uploaded' } });
        return;
      }

      // Construct multipart form data to forward to backend
      const formData = new FormData();
      formData.append('file', req.file.buffer, {
        filename: req.file.originalname,
        contentType: req.file.mimetype,
      });

      if (req.body.title) formData.append('title', req.body.title);
      if (req.body.description) formData.append('description', req.body.description);
      if (req.body.category) formData.append('category', req.body.category);
      if (req.body.tags) formData.append('tags', req.body.tags);

      const result = await backendClient.uploadDocument(req.user!.userId, formData);
      res.status(202).json(result);
    } catch (error: any) {
      if (error.response) {
        res.status(error.response.status).json(error.response.data);
      } else {
        next(error);
      }
    }
  },
);

// List documents with query filters
router.get('/', authMiddleware, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const params: Record<string, string> = {};
    for (const [key, val] of Object.entries(req.query)) {
      if (typeof val === 'string') params[key] = val;
    }
    const result = await backendClient.getDocuments(req.user!.userId, params);
    res.json(result);
  } catch (error: any) {
    if (error.response) {
      res.status(error.response.status).json(error.response.data);
    } else {
      next(error);
    }
  }
});

// Get single document
router.get('/:id', authMiddleware, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const id = getParamId(req);
    const result = await backendClient.getDocument(id, req.user!.userId);
    res.json(result);
  } catch (error: any) {
    if (error.response) {
      res.status(error.response.status).json(error.response.data);
    } else {
      next(error);
    }
  }
});

// Update document metadata
router.put('/:id', authMiddleware, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const id = getParamId(req);
    const result = await backendClient.updateDocument(id, req.user!.userId, req.body);
    res.json(result);
  } catch (error: any) {
    if (error.response) {
      res.status(error.response.status).json(error.response.data);
    } else {
      next(error);
    }
  }
});

// Delete document
router.delete('/:id', authMiddleware, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const id = getParamId(req);
    const result = await backendClient.deleteDocument(id, req.user!.userId);
    res.json(result);
  } catch (error: any) {
    if (error.response) {
      res.status(error.response.status).json(error.response.data);
    } else {
      next(error);
    }
  }
});

// Download document file
router.get('/:id/download', authMiddleware, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const id = getParamId(req);
    const result = await backendClient.downloadDocument(id, req.user!.userId);
    
    // Copy content headers from backend
    if (result.headers['content-type']) {
      res.setHeader('Content-Type', String(result.headers['content-type']));
    }
    if (result.headers['content-disposition']) {
      res.setHeader('Content-Disposition', String(result.headers['content-disposition']));
    }
    res.send(result.data);
  } catch (error: any) {
    if (error.response) {
      res.status(error.response.status).json(error.response.data);
    } else {
      next(error);
    }
  }
});

export default router;
