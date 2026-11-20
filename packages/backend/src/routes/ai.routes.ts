import { Router, Request, Response, NextFunction } from 'express';
import { RAGService } from '../services/rag.service.js';
import { getAIAdapter } from '../adapters/ai/index.js';
import { aiRequestDuration, aiRequestTotal, aiTokensUsed } from '../middleware/metrics.js';
import { ApiResponse } from '@documind/shared';

const router = Router();

function getUserId(req: Request): string {
  return (req.headers['x-user-id'] as string) || (req.body.userId as string) || '';
}

/**
 * Returns the currently active AI provider and model metadata.
 * Transparently indicates whether Amazon Bedrock or Local Mock AI is active.
 */
router.get('/info', (_req: Request, res: Response) => {
  const adapter = getAIAdapter();
  res.json({
    success: true,
    data: {
      provider: adapter.providerName,
      model: adapter.modelName,
      isMock: adapter.providerName === 'mock',
      description:
        adapter.providerName === 'bedrock'
          ? 'Live Amazon Bedrock Foundation Models (Claude 3 Haiku & Titan Embeddings)'
          : 'Local Synthetic Mock AI (Simulating Bedrock Claude 3 Haiku & Titan Embeddings)',
    },
  });
});

/**
 * Conversational RAG Question Answering Endpoint.
 * Ingests user question, retrieves relevant vector chunks, constructs grounded prompt,
 * and invokes Foundation Model.
 */
router.post('/ask', async (req: Request, res: Response, next: NextFunction) => {
  const adapter = getAIAdapter();
  const modelName = adapter.modelName;
  const endTimer = aiRequestDuration.startTimer({ operation: 'chat', model: modelName });

  try {
    const { documentId, question } = req.body;
    const userId = getUserId(req);

    if (!question || typeof question !== 'string') {
      res.status(400).json({
        success: false,
        error: { code: 'BAD_REQUEST', message: 'question is required' },
      });
      return;
    }

    const ragResult = await RAGService.answerQuestion(userId, question, documentId);

    // Record observability metrics
    endTimer();
    aiRequestTotal.inc({ operation: 'chat', model: modelName, status: 'success' });
    aiTokensUsed.inc(
      { operation: 'chat', model: modelName, direction: 'input' },
      ragResult.tokensUsed.input,
    );
    aiTokensUsed.inc(
      { operation: 'chat', model: modelName, direction: 'output' },
      ragResult.tokensUsed.output,
    );

    const response: ApiResponse<unknown> = {
      success: true,
      data: {
        answer: ragResult.answer,
        sources: ragResult.sources.map((s) => ({
          chunkId: s.chunkId,
          documentId: s.documentId,
          title: s.documentTitle,
          chunkText: s.text,
          score: Math.round(s.score * 100) / 100,
        })),
        tokensUsed: ragResult.tokensUsed,
        provider: ragResult.provider,
        model: ragResult.model,
      },
    };

    res.json(response);
  } catch (error) {
    endTimer();
    aiRequestTotal.inc({ operation: 'chat', model: modelName, status: 'error' });
    next(error);
  }
});

/**
 * Semantic Vector Search Endpoint.
 * Finds chunks semantically similar to query without running full text generation.
 */
router.post('/search', async (req: Request, res: Response, next: NextFunction) => {
  const adapter = getAIAdapter();
  const modelName = adapter.modelName;
  const endTimer = aiRequestDuration.startTimer({ operation: 'embed', model: modelName });

  try {
    const { query, documentId, topK } = req.body;
    const userId = getUserId(req);

    if (!query) {
      res.status(400).json({
        success: false,
        error: { code: 'BAD_REQUEST', message: 'query is required' },
      });
      return;
    }

    const results = await RAGService.searchSimilarChunks(userId, query, {
      documentId,
      topK: topK || 5,
    });

    endTimer();
    aiRequestTotal.inc({ operation: 'embed', model: modelName, status: 'success' });

    res.json({
      success: true,
      data: results,
    });
  } catch (error) {
    endTimer();
    aiRequestTotal.inc({ operation: 'embed', model: modelName, status: 'error' });
    next(error);
  }
});

export default router;
