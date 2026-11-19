import { Router, Request, Response, NextFunction } from 'express';
import multer from 'multer';
import { documentService } from '../services/document.service.js';
import { ApiResponse, DocumentMetadata, DocumentStatus, MAX_FILE_SIZE_BYTES } from '@documind/shared';

const router = Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_FILE_SIZE_BYTES },
});

function getUserId(req: Request): string {
  const userId = (req.headers['x-user-id'] as string) || (req.query.userId as string);
  return userId;
}

function getParamId(req: Request): string {
  return Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
}

// Upload document
router.post('/upload', upload.single('file'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = getUserId(req);
    if (!userId) {
      res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Missing user context' } });
      return;
    }

    if (!req.file) {
      res.status(400).json({ success: false, error: { code: 'BAD_REQUEST', message: 'No file uploaded' } });
      return;
    }

    const { title, description, category, tags } = req.body;
    let parsedTags: string[] = [];
    if (tags) {
      parsedTags = Array.isArray(tags) ? tags : String(tags).split(',').map((t) => t.trim()).filter(Boolean);
    }

    const doc = await documentService.createDocument(userId, req.file, {
      title: title || req.file.originalname,
      description,
      category: category || 'Other',
      tags: parsedTags,
    });

    const response: ApiResponse<DocumentMetadata> = {
      success: true,
      data: doc,
    };
    res.status(202).json(response);
  } catch (error) {
    next(error);
  }
});

// List documents with filtering and pagination
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = getUserId(req);
    if (!userId) {
      res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Missing user context' } });
      return;
    }

    const result = await documentService.getDocuments(userId, {
      search: req.query.search as string,
      category: req.query.category as string,
      tag: req.query.tag as string,
      status: req.query.status as DocumentStatus,
      page: Number(req.query.page) || 1,
      limit: Number(req.query.limit) || 20,
    });

    const response: ApiResponse<DocumentMetadata[]> = {
      success: true,
      data: result.documents,
      meta: {
        page: result.page,
        limit: result.limit,
        total: result.total,
        totalPages: Math.ceil(result.total / result.limit),
      },
    };
    res.json(response);
  } catch (error) {
    next(error);
  }
});

// Get single document metadata
router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = getUserId(req);
    if (!userId) {
      res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Missing user context' } });
      return;
    }

    const doc = await documentService.getDocumentById(getParamId(req), userId);
    const response: ApiResponse<DocumentMetadata> = {
      success: true,
      data: doc,
    };
    res.json(response);
  } catch (error) {
    next(error);
  }
});

// Update document metadata
router.put('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = getUserId(req);
    if (!userId) {
      res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Missing user context' } });
      return;
    }

    const doc = await documentService.updateDocument(getParamId(req), userId, req.body);
    const response: ApiResponse<DocumentMetadata> = {
      success: true,
      data: doc,
    };
    res.json(response);
  } catch (error) {
    next(error);
  }
});

// Delete document
router.delete('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = getUserId(req);
    if (!userId) {
      res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Missing user context' } });
      return;
    }

    const id = getParamId(req);
    await documentService.deleteDocument(id, userId);
    const response: ApiResponse<{ id: string; deleted: boolean }> = {
      success: true,
      data: { id, deleted: true },
    };
    res.json(response);
  } catch (error) {
    next(error);
  }
});

// Download document file stream/buffer
router.get('/:id/download', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = getUserId(req);
    if (!userId) {
      res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Missing user context' } });
      return;
    }

    const file = await documentService.getDocumentFile(getParamId(req), userId);
    res.setHeader('Content-Type', file.mimeType);
    res.setHeader('Content-Disposition', `attachment; filename="${file.fileName}"`);
    res.send(file.buffer);
  } catch (error) {
    next(error);
  }
});

export default router;
