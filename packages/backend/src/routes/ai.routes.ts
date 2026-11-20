import { Router, Request, Response, NextFunction } from 'express';
import { MockAIAdapter } from '../adapters/ai/mock-ai.adapter.js';
import { aiRequestDuration, aiRequestTotal, aiTokensUsed } from '../middleware/metrics.js';
import { DocumentModel } from '../models/document.model.js';
import { ApiResponse, AskQuestionResponse } from '@documind/shared';

const router = Router();
const aiAdapter = new MockAIAdapter();

router.post('/ask', async (req: Request, res: Response, next: NextFunction) => {
  const { documentId, question } = req.body;
  const modelName = 'anthropic.claude-3-haiku';
  const endTimer = aiRequestDuration.startTimer({ operation: 'chat', model: modelName });

  try {
    if (!question) {
      res.status(400).json({ success: false, error: { code: 'BAD_REQUEST', message: 'question is required' } });
      return;
    }

    // Retrieve document context if available
    let contextSnippets: string[] = [];
    if (documentId) {
      const doc = await DocumentModel.findById(documentId);
      if (doc) {
        contextSnippets.push(`Document: "${doc.title}". ${doc.summary || doc.description || ''}`);
      }
    }

    const aiResult = await aiAdapter.chat({
      question,
      context: contextSnippets,
    });

    // Record observability metrics
    endTimer();
    aiRequestTotal.inc({ operation: 'chat', model: modelName, status: 'success' });
    aiTokensUsed.inc({ operation: 'chat', model: modelName, direction: 'input' }, aiResult.tokensUsed.input);
    aiTokensUsed.inc({ operation: 'chat', model: modelName, direction: 'output' }, aiResult.tokensUsed.output);

    const response: ApiResponse<AskQuestionResponse> = {
      success: true,
      data: {
        answer: aiResult.answer,
        sources: contextSnippets.map((text) => ({ chunkText: text, score: 0.95 })),
        tokensUsed: aiResult.tokensUsed,
      },
    };
    res.json(response);
  } catch (error) {
    endTimer();
    aiRequestTotal.inc({ operation: 'chat', model: modelName, status: 'error' });
    next(error);
  }
});

export default router;
