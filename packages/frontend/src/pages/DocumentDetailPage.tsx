import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  FileText,
  Download,
  Trash2,
  Sparkles,
  ArrowLeft,
  Calendar,
  HardDrive,
  Tag,
  Folder,
  MessageSquare,
  CheckCircle2,
  AlertTriangle,
  Loader2,
} from 'lucide-react';
import { useDocumentStore } from '../store/documentStore';
import { DocumentMetadata } from '../types';

export const DocumentDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { fetchDocumentById, deleteDocument, downloadDocument } = useDocumentStore();

  const [document, setDocument] = useState<DocumentMetadata | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    loadDoc();
  }, [id]);

  const loadDoc = async () => {
    if (!id) return;
    try {
      setLoading(true);
      const data = await fetchDocumentById(id);
      setDocument(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load document');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!document) return;
    if (window.confirm(`Are you sure you want to delete "${document.title}"?`)) {
      try {
        await deleteDocument(document.id);
        navigate('/documents');
      } catch {
        alert('Failed to delete document');
      }
    }
  };

  const handleDownload = async () => {
    if (!document) return;
    try {
      await downloadDocument(document.id, document.fileName);
    } catch {
      alert('Failed to download document');
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] text-gray-400 space-y-3">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        <p className="text-sm font-medium">Loading document details...</p>
      </div>
    );
  }

  if (error || !document) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-12 text-center space-y-4">
        <AlertTriangle className="h-10 w-10 text-red-500 mx-auto" />
        <h2 className="text-xl font-bold text-gray-900">Document Not Found</h2>
        <p className="text-sm text-gray-500">{error || 'This document does not exist or has been deleted.'}</p>
        <Link to="/documents" className="inline-flex items-center gap-1.5 text-sm font-semibold text-blue-600 hover:underline">
          <ArrowLeft className="h-4 w-4" /> Back to Documents
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Navigation Breadcrumb */}
      <div className="flex items-center justify-between">
        <Link
          to="/documents"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Documents</span>
        </Link>
        <div className="flex items-center gap-2">
          <button
            onClick={handleDownload}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 rounded-lg text-xs font-semibold shadow-sm transition-colors"
          >
            <Download className="h-3.5 w-3.5" />
            Download Original
          </button>
          <button
            onClick={handleDelete}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-red-200 text-red-600 hover:bg-red-50 rounded-lg text-xs font-semibold shadow-sm transition-colors"
          >
            <Trash2 className="h-3.5 w-3.5" />
            Delete
          </button>
        </div>
      </div>

      {/* Main Document Card Header */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 sm:p-8 shadow-sm space-y-4">
        <div className="flex flex-wrap items-center gap-2.5">
          <span className="px-3 py-1 bg-blue-50 text-blue-700 rounded-md text-xs font-semibold">
            {document.category}
          </span>
          {document.status === 'ready' && (
            <span className="inline-flex items-center gap-1 px-3 py-1 bg-emerald-50 text-emerald-700 rounded-md text-xs font-semibold">
              <CheckCircle2 className="h-3.5 w-3.5" />
              Ingested & Ready
            </span>
          )}
          {document.status === 'processing' && (
            <span className="inline-flex items-center gap-1 px-3 py-1 bg-amber-50 text-amber-800 rounded-md text-xs font-semibold animate-pulse">
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              Summarization in Progress
            </span>
          )}
        </div>

        <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
          {document.title}
        </h1>

        {document.description && (
          <p className="text-sm text-gray-600 leading-relaxed max-w-3xl">
            {document.description}
          </p>
        )}

        {/* Metadata Badges Bar */}
        <div className="pt-4 border-t border-gray-100 grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs text-gray-500">
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-gray-400" />
            <span className="truncate">{document.fileName}</span>
          </div>
          <div className="flex items-center gap-2">
            <HardDrive className="h-4 w-4 text-gray-400" />
            <span>{(document.fileSize / 1024).toFixed(1)} KB</span>
          </div>
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-gray-400" />
            <span>{new Date(document.createdAt).toLocaleDateString()}</span>
          </div>
          <div className="flex items-center gap-2">
            <Folder className="h-4 w-4 text-gray-400" />
            <span className="truncate">{document.s3Key}</span>
          </div>
        </div>

        {/* Tags */}
        {document.tags && document.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 pt-2">
            {document.tags.map((tag) => (
              <span key={tag} className="inline-flex items-center gap-1 text-xs font-medium bg-gray-100 text-gray-700 px-2.5 py-1 rounded-full">
                <Tag className="h-3 w-3 text-gray-400" />
                #{tag}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* AI Summary Card */}
      <div className="bg-gradient-to-br from-purple-50/50 via-white to-indigo-50/30 rounded-2xl border border-purple-100 p-6 sm:p-8 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-purple-800">
            <Sparkles className="h-5 w-5 text-purple-600" />
            <h2 className="text-lg font-bold">Amazon Bedrock AI Summary</h2>
          </div>
          <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-purple-100 text-purple-700">
            Claude 3 Haiku
          </span>
        </div>

        {document.summary ? (
          <div className="space-y-3">
            <p className="text-sm text-gray-800 leading-relaxed whitespace-pre-line bg-white/70 p-4 rounded-xl border border-purple-100 shadow-xs">
              {document.summary}
            </p>
            <p className="text-xs text-gray-400 italic">
              Generated by background worker job through Amazon Bedrock Foundation Models.
            </p>
          </div>
        ) : (
          <div className="py-6 text-center text-sm text-amber-700 space-y-2">
            <Loader2 className="h-6 w-6 animate-spin mx-auto text-amber-600" />
            <p className="font-medium">Summary generation is being processed by the worker queue...</p>
            <p className="text-xs text-gray-500">This page will update once the task completes.</p>
          </div>
        )}

        {/* Action Teaser for Phase 5 */}
        <div className="pt-4 border-t border-purple-100 flex items-center justify-between">
          <span className="text-xs text-gray-500">Want to query this document in depth?</span>
          <Link
            to={`/chat?docId=${document.id}`}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-purple-700 hover:text-purple-900 bg-purple-100 hover:bg-purple-200 px-3 py-1.5 rounded-lg transition-colors"
          >
            <MessageSquare className="h-3.5 w-3.5" />
            Ask AI Assistant
          </Link>
        </div>
      </div>
    </div>
  );
};
