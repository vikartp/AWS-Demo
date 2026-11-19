import express from 'express';
import cors from 'cors';

const app = express();
app.use(cors());
app.use(express.json({ limit: '10mb' }));

const PORT = parseInt(process.env.PORT || '3003', 10);

// Health check
app.get('/health', (_req, res) => {
  res.json({
    status: 'healthy',
    service: 'mock-ai',
    note: 'This is a MOCK service. NOT Amazon Bedrock.',
  });
});

/**
 * Mock summarization endpoint.
 * Simulates: Amazon Bedrock -> Claude 3 Haiku -> InvokeModel
 * Returns a deterministic summary based on input text length.
 */
app.post('/api/summarize', (req, res) => {
  const { text } = req.body;

  if (!text) {
    res.status(400).json({ error: 'text is required' });
    return;
  }

  const words = text.split(/\s+/);
  const summary = `[MOCK SUMMARY] This document contains ${words.length} words. ` +
    `Key topics appear to include: ${words.slice(0, 5).join(', ')}. ` +
    `The document discusses ${Math.ceil(words.length / 100)} main themes. ` +
    `This is a simulated summary — in production, Amazon Bedrock (Claude) generates real summaries.`;

  // Simulate latency
  setTimeout(() => {
    res.json({
      summary,
      tokensUsed: {
        input: Math.ceil(words.length * 1.3),
        output: Math.ceil(summary.split(/\s+/).length * 1.3),
      },
    });
  }, 500 + Math.random() * 1000);
});

/**
 * Mock embedding endpoint.
 * Simulates: Amazon Bedrock -> Titan Embeddings V2 -> InvokeModel
 * Returns a deterministic 1536-dimensional vector.
 */
app.post('/api/embed', (req, res) => {
  const { text } = req.body;

  if (!text) {
    res.status(400).json({ error: 'text is required' });
    return;
  }

  // Generate a deterministic pseudo-embedding based on text hash
  const embedding: number[] = [];
  let hash = 0;
  for (let i = 0; i < text.length; i++) {
    hash = ((hash << 5) - hash + text.charCodeAt(i)) | 0;
  }

  for (let i = 0; i < 1536; i++) {
    hash = ((hash << 5) - hash + i) | 0;
    embedding.push(((hash & 0xffff) / 0xffff) * 2 - 1);
  }

  setTimeout(() => {
    res.json({
      embedding,
      tokensUsed: {
        input: Math.ceil(text.split(/\s+/).length * 1.3),
        output: 0,
      },
    });
  }, 200 + Math.random() * 300);
});

/**
 * Mock chat/question-answering endpoint.
 * Simulates: Amazon Bedrock -> Claude 3 Haiku -> Converse API
 * Returns a canned response incorporating the context.
 */
app.post('/api/chat', (req, res) => {
  const { question, context, conversationHistory } = req.body;

  if (!question) {
    res.status(400).json({ error: 'question is required' });
    return;
  }

  const contextSnippet = context && context.length > 0
    ? context[0].substring(0, 100)
    : 'no specific context provided';

  const historyCount = conversationHistory?.length || 0;

  const answer = `[MOCK AI RESPONSE] Based on the provided context ("${contextSnippet}..."), ` +
    `here is my answer to your question "${question}": ` +
    `The document contains relevant information about this topic. ` +
    `${historyCount > 0 ? `(Continuing from ${historyCount} previous messages.) ` : ''}` +
    `In production, Amazon Bedrock (Claude) would provide a real, context-aware answer ` +
    `using Retrieval-Augmented Generation (RAG).`;

  setTimeout(() => {
    res.json({
      answer,
      tokensUsed: {
        input: Math.ceil((question.length + (context?.join(' ').length || 0)) / 4),
        output: Math.ceil(answer.split(/\s+/).length * 1.3),
      },
    });
  }, 800 + Math.random() * 1500);
});

app.listen(PORT, () => {
  console.log(`
╔══════════════════════════════════════════════════════╗
║           MOCK AI SERVICE (NOT Bedrock)              ║
║                                                      ║
║  This service simulates Amazon Bedrock responses     ║
║  for LOCAL DEVELOPMENT ONLY.                         ║
║                                                      ║
║  Endpoints:                                          ║
║    POST /api/summarize  (simulates Claude Haiku)     ║
║    POST /api/embed      (simulates Titan Embeddings) ║
║    POST /api/chat       (simulates Claude Converse)  ║
║                                                      ║
║  Port: ${PORT}                                         ║
╚══════════════════════════════════════════════════════╝
  `);
});
