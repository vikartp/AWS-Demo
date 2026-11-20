import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Send,
  Bot,
  User,
  Sparkles,
  FileText,
  ChevronDown,
  ChevronUp,
  Loader2,
  Database,
  Cpu,
  Layers,
  ArrowRight,
} from 'lucide-react';
import { api } from '../services/api';
import { useDocumentStore } from '../store/documentStore';
import { ApiResponse, AskQuestionResponse, AiInfoResponse, AiSource } from '../types';

interface Message {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  sources?: AiSource[];
  tokensUsed?: { input: number; output: number };
  timestamp: Date;
  model?: string;
  provider?: string;
}

const STARTER_PROMPTS = [
  'Summarize the core architectural decisions in my documents.',
  'What are the key security and IAM least privilege policies mentioned?',
  'How is asynchronous worker job processing implemented?',
  'What is the difference between AWS Lambda and ECS Fargate for our stack?',
];

export const ChatPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const initialDocId = searchParams.get('docId') || '';

  const { documents, fetchDocuments } = useDocumentStore();
  const [selectedDocId, setSelectedDocId] = useState<string>(initialDocId);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [aiInfo, setAiInfo] = useState<AiInfoResponse | null>(null);
  const [expandedSources, setExpandedSources] = useState<Record<string, boolean>>({});
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchDocuments();
    loadAiInfo();
  }, []);

  useEffect(() => {
    if (initialDocId) {
      setSelectedDocId(initialDocId);
    }
  }, [initialDocId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const loadAiInfo = async () => {
    try {
      const res = await api.get<ApiResponse<AiInfoResponse>>('/ai/info');
      if (res.data.data) {
        setAiInfo(res.data.data);
      }
    } catch (err) {
      console.warn('Failed to fetch AI provider info:', err);
    }
  };

  const handleSend = async (questionText?: string) => {
    const q = (questionText || input).trim();
    if (!q || loading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      sender: 'user',
      text: q,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    if (!questionText) setInput('');
    setLoading(true);

    try {
      const res = await api.post<ApiResponse<AskQuestionResponse>>('/ai/ask', {
        question: q,
        documentId: selectedDocId || undefined,
      });

      if (res.data.data) {
        const aiData = res.data.data;
        const assistantMessage: Message = {
          id: (Date.now() + 1).toString(),
          sender: 'assistant',
          text: aiData.answer,
          sources: aiData.sources,
          tokensUsed: aiData.tokensUsed,
          timestamp: new Date(),
          provider: aiData.provider,
          model: aiData.model,
        };
        setMessages((prev) => [...prev, assistantMessage]);
      }
    } catch (err: any) {
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        sender: 'assistant',
        text: `Error invoking AI service: ${err.response?.data?.error?.message || err.message || 'Unknown error'}`,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  const toggleSources = (msgId: string) => {
    setExpandedSources((prev) => ({ ...prev, [msgId]: !prev[msgId] }));
  };

  const readyDocuments = documents.filter((d) => d.status === 'ready');
  const activeDoc = documents.find((d) => d.id === selectedDocId);

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-4">
      {/* Top AI Engine Header & Scope Selector */}
      <div className="bg-white rounded-2xl border border-gray-200 p-4 sm:p-5 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl text-white shadow-sm">
            <Sparkles className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold text-gray-900">DocuMind AI Assistant</h1>
              {aiInfo && (
                <span
                  className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full ${
                    aiInfo.isMock
                      ? 'bg-amber-100 text-amber-800 border border-amber-200'
                      : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                  }`}
                  title={aiInfo.description}
                >
                  {aiInfo.isMock ? 'Local Mock AI' : 'Amazon Bedrock Live'}
                </span>
              )}
            </div>
            <p className="text-xs text-gray-500">
              Retrieval-Augmented Generation (RAG) powered by Claude 3 Haiku & Titan Vector Embeddings
            </p>
          </div>
        </div>

        {/* Scope Document Selector */}
        <div className="flex items-center gap-2 min-w-[260px]">
          <Database className="h-4 w-4 text-gray-400 shrink-0" />
          <div className="flex-1">
            <label className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 block mb-0.5">
              Knowledge Scope
            </label>
            <select
              value={selectedDocId}
              onChange={(e) => setSelectedDocId(e.target.value)}
              className="w-full text-xs font-medium bg-gray-50 border border-gray-200 rounded-lg px-2.5 py-1.5 text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Ingested Documents (Global Search)</option>
              {readyDocuments.map((doc) => (
                <option key={doc.id} value={doc.id}>
                  📄 {doc.title}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Scope Indicator Notification if single document selected */}
      {activeDoc && (
        <div className="bg-blue-50/70 border border-blue-200/80 rounded-xl px-4 py-2.5 flex items-center justify-between text-xs text-blue-900">
          <div className="flex items-center gap-2 truncate">
            <FileText className="h-4 w-4 text-blue-600 shrink-0" />
            <span className="truncate">
              Grounded exclusively to: <strong>{activeDoc.title}</strong>
            </span>
          </div>
          <button
            onClick={() => setSelectedDocId('')}
            className="text-blue-700 hover:text-blue-900 font-semibold underline shrink-0 ml-2 text-[11px]"
          >
            Clear scope
          </button>
        </div>
      )}

      {/* Chat Messages Container */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm flex flex-col h-[520px]">
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-4">
              <div className="w-12 h-12 bg-purple-50 text-purple-600 rounded-2xl flex items-center justify-center">
                <Bot className="h-6 w-6" />
              </div>
              <div className="space-y-1 max-w-md">
                <h3 className="text-base font-semibold text-gray-900">
                  Ask anything about your knowledge base
                </h3>
                <p className="text-xs text-gray-500">
                  DocuMind extracts semantically relevant passages using vector similarity search
                  before Claude 3 Haiku answers your question.
                </p>
              </div>

              {/* Starter Questions Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-4 max-w-xl w-full">
                {STARTER_PROMPTS.map((prompt, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSend(prompt)}
                    className="text-left text-xs bg-gray-50 hover:bg-purple-50/70 hover:border-purple-200 border border-gray-200/80 rounded-xl p-3 text-gray-700 transition-all flex items-start gap-2 group"
                  >
                    <ArrowRight className="h-3.5 w-3.5 text-gray-400 group-hover:text-purple-600 shrink-0 mt-0.5" />
                    <span>{prompt}</span>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex gap-3 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {msg.sender === 'assistant' && (
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-purple-600 to-indigo-600 text-white flex items-center justify-center shrink-0 mt-1 shadow-xs">
                    <Bot className="h-4 w-4" />
                  </div>
                )}

                <div
                  className={`max-w-2xl rounded-2xl p-4 space-y-2 text-sm ${
                    msg.sender === 'user'
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'bg-gray-50 text-gray-900 border border-gray-200/90'
                  }`}
                >
                  <p className="leading-relaxed whitespace-pre-line">{msg.text}</p>

                  {/* Grounded RAG Sources & Citations */}
                  {msg.sources && msg.sources.length > 0 && (
                    <div className="pt-2 border-t border-gray-200/80 mt-2 space-y-1.5">
                      <button
                        onClick={() => toggleSources(msg.id)}
                        className="inline-flex items-center gap-1.5 text-xs font-semibold text-purple-700 hover:text-purple-900 transition-colors"
                      >
                        <Layers className="h-3.5 w-3.5" />
                        <span>{msg.sources.length} Grounded Context Sources</span>
                        {expandedSources[msg.id] ? (
                          <ChevronUp className="h-3.5 w-3.5" />
                        ) : (
                          <ChevronDown className="h-3.5 w-3.5" />
                        )}
                      </button>

                      {expandedSources[msg.id] && (
                        <div className="space-y-2 pt-1">
                          {msg.sources.map((s, idx) => (
                            <div
                              key={idx}
                              className="bg-white p-2.5 rounded-lg border border-purple-100 text-xs space-y-1 shadow-2xs"
                            >
                              <div className="flex items-center justify-between font-semibold text-gray-700 text-[11px]">
                                <span className="flex items-center gap-1 truncate">
                                  <FileText className="h-3 w-3 text-purple-600" />
                                  {s.title || 'Document Section'}
                                </span>
                                <span className="text-purple-700 bg-purple-50 px-1.5 py-0.5 rounded text-[10px]">
                                  {(s.score * 100).toFixed(0)}% Match
                                </span>
                              </div>
                              <p className="text-gray-600 text-[11px] leading-snug line-clamp-3 italic">
                                "{s.chunkText}"
                              </p>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Token & Model Attribution */}
                  {msg.tokensUsed && (
                    <div className="flex items-center gap-3 pt-1 text-[10px] text-gray-400">
                      <span className="flex items-center gap-1">
                        <Cpu className="h-3 w-3" />
                        {msg.model || 'Claude 3 Haiku'}
                      </span>
                      <span>•</span>
                      <span>
                        Tokens: {msg.tokensUsed.input} in / {msg.tokensUsed.output} out
                      </span>
                    </div>
                  )}
                </div>

                {msg.sender === 'user' && (
                  <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center shrink-0 mt-1">
                    <User className="h-4 w-4" />
                  </div>
                )}
              </div>
            ))
          )}

          {loading && (
            <div className="flex gap-3 items-start">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-purple-600 to-indigo-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                <Loader2 className="h-4 w-4 animate-spin" />
              </div>
              <div className="bg-gray-50 border border-gray-200 rounded-2xl p-4 text-xs text-gray-500 space-y-1">
                <p className="font-semibold text-gray-700 flex items-center gap-1.5">
                  <Sparkles className="h-3.5 w-3.5 text-purple-600 animate-pulse" />
                  Vector Search & Bedrock Synthesis in progress...
                </p>
                <p className="text-[11px]">
                  Retrieving embeddings, performing cosine similarity ranking, and invoking Claude 3 Haiku.
                </p>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Bar */}
        <div className="p-3 sm:p-4 border-t border-gray-200 bg-gray-50/50 rounded-b-2xl">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="flex items-center gap-2"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={
                activeDoc
                  ? `Ask about "${activeDoc.title}"...`
                  : 'Ask a question across all documents...'
              }
              disabled={loading}
              className="flex-1 bg-white border border-gray-300 rounded-xl px-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
            />
            <button
              type="submit"
              disabled={!input.trim() || loading}
              className="inline-flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white font-semibold text-sm px-4 py-2.5 rounded-xl transition-colors shadow-sm shrink-0"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              <span className="hidden sm:inline">Ask</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
