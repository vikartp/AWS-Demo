export interface SummarizeParams {
  text: string;
  maxLength?: number;
}

export interface EmbedParams {
  text: string;
}

export interface ChatParams {
  question: string;
  context: string[];
  conversationHistory?: Array<{ role: 'user' | 'assistant'; content: string }>;
}

export interface AISummarizeResult {
  summary: string;
  tokensUsed: { input: number; output: number };
}

export interface AIEmbedResult {
  embedding: number[];
  tokensUsed: { input: number; output: number };
}

export interface AIChatResult {
  answer: string;
  tokensUsed: { input: number; output: number };
}

export interface IAIAdapter {
  readonly providerName: string;
  readonly modelName: string;
  summarize(params: SummarizeParams): Promise<AISummarizeResult>;
  embed(params: EmbedParams): Promise<AIEmbedResult>;
  chat(params: ChatParams): Promise<AIChatResult>;
}
