import { DocumentChunkModel } from '../models/document-chunk.model.js';
import { DocumentModel } from '../models/document.model.js';
import { getAIAdapter } from '../adapters/ai/index.js';
import { logger } from '../utils/logger.js';

export interface RetrievedChunk {
  chunkId: string;
  documentId: string;
  documentTitle?: string;
  text: string;
  score: number;
}

export interface RAGAnswerResult {
  answer: string;
  sources: RetrievedChunk[];
  tokensUsed: {
    input: number;
    output: number;
  };
  provider: string;
  model: string;
}

export class RAGService {
  /**
   * Recursive character-based text chunker with overlap to preserve semantic context.
   */
  static chunkText(text: string, chunkSize = 800, overlap = 150): string[] {
    const cleaned = text.trim();
    if (cleaned.length <= chunkSize) {
      return [cleaned];
    }

    const chunks: string[] = [];
    let start = 0;

    while (start < cleaned.length) {
      let end = start + chunkSize;

      if (end >= cleaned.length) {
        chunks.push(cleaned.substring(start));
        break;
      }

      // Try to find natural breaking point: double newline, newline, period, space
      const slice = cleaned.substring(start, end);
      let breakIdx = slice.lastIndexOf('\n\n');
      if (breakIdx === -1 || breakIdx < chunkSize * 0.5) {
        breakIdx = slice.lastIndexOf('\n');
      }
      if (breakIdx === -1 || breakIdx < chunkSize * 0.5) {
        breakIdx = slice.lastIndexOf('. ');
      }
      if (breakIdx === -1 || breakIdx < chunkSize * 0.5) {
        breakIdx = slice.lastIndexOf(' ');
      }

      if (breakIdx > chunkSize * 0.3) {
        chunks.push(cleaned.substring(start, start + breakIdx).trim());
        start = start + breakIdx + 1 - overlap;
      } else {
        chunks.push(cleaned.substring(start, end).trim());
        start = end - overlap;
      }

      if (start < 0) start = 0;
    }

    return chunks.filter((c) => c.length > 20);
  }

  /**
   * Calculates cosine similarity between two vector embeddings.
   * Returns a value between -1.0 and 1.0 (typically 0.0 to 1.0 for normalized text vectors).
   */
  static cosineSimilarity(vecA: number[], vecB: number[]): number {
    if (!vecA || !vecB || vecA.length === 0 || vecA.length !== vecB.length) {
      return 0;
    }

    let dotProduct = 0;
    let normA = 0;
    let normB = 0;

    for (let i = 0; i < vecA.length; i++) {
      dotProduct += vecA[i] * vecB[i];
      normA += vecA[i] * vecA[i];
      normB += vecB[i] * vecB[i];
    }

    const magnitude = Math.sqrt(normA) * Math.sqrt(normB);
    return magnitude === 0 ? 0 : dotProduct / magnitude;
  }

  /**
   * Ingests, chunks, and creates vector embeddings for a document in MongoDB.
   */
  static async ingestDocumentChunks(
    documentId: string,
    userId: string,
    rawText: string,
  ): Promise<number> {
    const aiAdapter = getAIAdapter();
    const chunks = this.chunkText(rawText);

    logger.info(`[RAG] Ingesting ${chunks.length} chunks for document ${documentId}`);

    // Remove existing chunks if re-processing
    await DocumentChunkModel.deleteMany({ documentId });

    let chunkIndex = 0;
    for (const chunkText of chunks) {
      try {
        const { embedding, tokensUsed } = await aiAdapter.embed({ text: chunkText });

        await DocumentChunkModel.create({
          documentId,
          userId,
          chunkIndex,
          text: chunkText,
          embedding,
          tokenCount: tokensUsed.input,
        });

        chunkIndex++;
      } catch (err) {
        logger.error(`[RAG] Failed to embed chunk ${chunkIndex} for document ${documentId}:`, err);
      }
    }

    logger.info(
      `[RAG] Successfully stored ${chunkIndex} vector embeddings for document ${documentId}`,
    );
    return chunkIndex;
  }

  /**
   * Performs semantic vector search to find the most relevant chunks for a question.
   */
  static async searchSimilarChunks(
    userId: string,
    question: string,
    options: { documentId?: string; topK?: number; threshold?: number } = {},
  ): Promise<RetrievedChunk[]> {
    const { documentId, topK = 4, threshold = 0.4 } = options;
    const aiAdapter = getAIAdapter();

    // 1. Generate embedding for query
    const { embedding: queryVector } = await aiAdapter.embed({ text: question });

    // 2. Query candidates from MongoDB
    const filter: Record<string, unknown> = { userId };
    if (documentId) {
      filter.documentId = documentId;
    }

    const candidates = await DocumentChunkModel.find(filter).lean();

    if (candidates.length === 0) {
      return [];
    }

    // 3. Compute cosine similarity against candidate embeddings
    const scoredChunks = candidates.map((chunk) => {
      const score = this.cosineSimilarity(queryVector, chunk.embedding);
      return {
        chunkId: String(chunk._id),
        documentId: chunk.documentId,
        text: chunk.text,
        score,
      };
    });

    // 4. Sort descending by similarity score
    scoredChunks.sort((a, b) => b.score - a.score);

    // 5. Filter by threshold and take topK
    const topChunks = scoredChunks
      .filter((c) => c.score >= threshold)
      .slice(0, topK);

    // 6. Enrich with document titles
    const docIds = Array.from(new Set(topChunks.map((c) => c.documentId)));
    const documents = await DocumentModel.find({ _id: { $in: docIds } }).lean();
    const docTitleMap = new Map(documents.map((d) => [String(d._id), d.title]));

    return topChunks.map((c) => ({
      ...c,
      documentTitle: docTitleMap.get(c.documentId) || 'Document',
    }));
  }

  /**
   * Orchestrates the complete RAG Question-Answering pipeline:
   * 1. Vector Search for relevant chunks
   * 2. Grounded Prompt Synthesis
   * 3. Foundation Model Invocation (Bedrock Claude 3 Haiku or Mock)
   */
  static async answerQuestion(
    userId: string,
    question: string,
    documentId?: string,
  ): Promise<RAGAnswerResult> {
    const aiAdapter = getAIAdapter();

    // 1. Retrieve relevant chunks
    const retrievedChunks = await this.searchSimilarChunks(userId, question, {
      documentId,
      topK: 4,
      threshold: 0.35,
    });

    // Format context snippets
    let contextSnippets: string[] = [];

    if (retrievedChunks.length > 0) {
      contextSnippets = retrievedChunks.map(
        (c, idx) =>
          `[Source ${idx + 1}: "${c.documentTitle}" (Score: ${(c.score * 100).toFixed(1)}%)]\n${c.text}`,
      );
    } else if (documentId) {
      // Fallback: Use document metadata & summary if no specific chunks matched
      const doc = await DocumentModel.findById(documentId).lean();
      if (doc) {
        contextSnippets.push(
          `[Source: "${doc.title}"]\nSummary: ${doc.summary || doc.description || 'No summary available.'}`,
        );
      }
    }

    // 2. Invoke Foundation Model
    const chatResult = await aiAdapter.chat({
      question,
      context: contextSnippets,
    });

    return {
      answer: chatResult.answer,
      sources: retrievedChunks,
      tokensUsed: chatResult.tokensUsed,
      provider: aiAdapter.providerName,
      model: aiAdapter.modelName,
    };
  }
}
