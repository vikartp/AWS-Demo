import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { FileText, Download, Trash2, Sparkles, Clock, CheckCircle2, AlertTriangle, Loader2 } from 'lucide-react';
import { DocumentMetadata } from '../types';
import { useDocumentStore } from '../store/documentStore';

interface DocumentCardProps {
  document: DocumentMetadata;
}

export const DocumentCard: React.FC<DocumentCardProps> = ({ document: doc }) => {
  const { deleteDocument, downloadDocument } = useDocumentStore();
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (window.confirm(`Are you sure you want to delete "${doc.title}"?`)) {
      setIsDeleting(true);
      try {
        await deleteDocument(doc.id);
      } catch (err) {
        alert('Failed to delete document');
      } finally {
        setIsDeleting(false);
      }
    }
  };

  const handleDownload = async (e: React.MouseEvent) => {
    e.preventDefault();
    try {
      await downloadDocument(doc.id, doc.fileName);
    } catch {
      alert('Failed to download document');
    }
  };

  const renderStatusBadge = () => {
    switch (doc.status) {
      case 'processing':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 animate-pulse">
            <Loader2 className="h-3 w-3 animate-spin" />
            AI Summarizing...
          </span>
        );
      case 'ready':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
            <CheckCircle2 className="h-3 w-3" />
            Ready
          </span>
        );
      case 'error':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-100 text-red-800">
            <AlertTriangle className="h-3 w-3" />
            Failed
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-800">
            <Clock className="h-3 w-3" />
            Uploading
          </span>
        );
    }
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 hover:border-blue-400 hover:shadow-md transition-all flex flex-col justify-between overflow-hidden group">
      <div className="p-5">
        {/* Top Badges */}
        <div className="flex items-center justify-between gap-2 mb-3">
          <span className="text-xs font-semibold px-2.5 py-0.5 rounded bg-gray-100 text-gray-700">
            {doc.category}
          </span>
          {renderStatusBadge()}
        </div>

        {/* Title */}
        <Link to={`/documents/${doc.id}`}>
          <h4 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors line-clamp-1 text-base">
            {doc.title}
          </h4>
        </Link>
        <p className="text-xs text-gray-400 mt-0.5 truncate">{doc.fileName} &middot; {(doc.fileSize / 1024).toFixed(1)} KB</p>

        {/* AI Summary Preview or Description */}
        <div className="mt-3 bg-gray-50 rounded-lg p-3 border border-gray-100 min-h-[72px]">
          {doc.summary ? (
            <div className="space-y-1">
              <div className="flex items-center gap-1 text-[11px] font-semibold text-purple-700">
                <Sparkles className="h-3 w-3 text-purple-600" />
                <span>AI Summary</span>
              </div>
              <p className="text-xs text-gray-600 line-clamp-2 leading-relaxed">
                {doc.summary}
              </p>
            </div>
          ) : doc.status === 'processing' ? (
            <div className="flex items-center justify-center h-full text-xs text-amber-700 gap-1.5 py-2">
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              <span>Background worker analyzing document...</span>
            </div>
          ) : (
            <p className="text-xs text-gray-500 italic line-clamp-2">
              {doc.description || 'No description provided.'}
            </p>
          )}
        </div>

        {/* Tags */}
        {doc.tags && doc.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-3">
            {doc.tags.slice(0, 4).map((tag) => (
              <span key={tag} className="text-[11px] bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full font-medium">
                #{tag}
              </span>
            ))}
            {doc.tags.length > 4 && (
              <span className="text-[11px] text-gray-400 px-1 py-0.5 font-medium">
                +{doc.tags.length - 4}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Card Footer Actions */}
      <div className="px-5 py-3 bg-gray-50 border-t border-gray-100 flex items-center justify-between text-xs">
        <Link
          to={`/documents/${doc.id}`}
          className="text-blue-600 font-medium hover:text-blue-800 flex items-center gap-1"
        >
          <FileText className="h-3.5 w-3.5" />
          Details
        </Link>
        <div className="flex items-center gap-2">
          <button
            onClick={handleDownload}
            className="p-1.5 text-gray-500 hover:text-gray-800 hover:bg-white rounded transition-colors"
            title="Download original file"
          >
            <Download className="h-4 w-4" />
          </button>
          <button
            onClick={handleDelete}
            disabled={isDeleting}
            className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-white rounded transition-colors"
            title="Delete document"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
