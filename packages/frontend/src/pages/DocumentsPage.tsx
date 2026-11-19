import React, { useEffect, useState, useMemo } from 'react';
import { Plus, Search, Filter, RefreshCw, FileText, Loader2, FolderKanban } from 'lucide-react';
import { useDocumentStore } from '../store/documentStore';
import { DocumentCard } from '../components/DocumentCard';
import { UploadModal } from '../components/UploadModal';
import { DOCUMENT_CATEGORIES } from '../types';

export const DocumentsPage: React.FC = () => {
  const { documents, total, isLoading, fetchDocuments, setFilters, filters } = useDocumentStore();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState(filters.search || '');

  // Initial fetch
  useEffect(() => {
    fetchDocuments();
  }, []);

  // Real-time polling: automatically polls while any document is in 'processing' status
  const hasProcessing = useMemo(() => {
    return documents.some((d) => d.status === 'processing' || d.status === 'uploading');
  }, [documents]);

  useEffect(() => {
    if (!hasProcessing) return;
    const interval = setInterval(() => {
      fetchDocuments();
    }, 3000);
    return () => clearInterval(interval);
  }, [hasProcessing]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchTerm !== (filters.search || '')) {
        setFilters({ search: searchTerm || undefined, page: 1 });
      }
    }, 400);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const handleCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setFilters({ category: e.target.value || undefined, page: 1 });
  };

  const handleStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setFilters({ status: e.target.value || undefined, page: 1 });
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Page Title & Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight flex items-center gap-2.5">
            <FolderKanban className="h-7 w-7 text-blue-600" />
            Knowledge Repository
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Manage your document knowledge base. Processed automatically via Amazon Bedrock Claude Haiku.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => fetchDocuments()}
            disabled={isLoading}
            className="p-2.5 text-gray-600 hover:text-gray-900 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors shadow-sm"
            title="Refresh list"
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold px-4 py-2.5 rounded-xl shadow-md shadow-blue-500/20 transition-all text-sm"
          >
            <Plus className="h-4 w-4" />
            <span>Upload Document</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-sm flex flex-col md:flex-row gap-3">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search documents by title, description, or #tag..."
            className="w-full pl-10 pr-4 py-2 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
          />
        </div>

        {/* Category Filter */}
        <div className="flex items-center gap-2 sm:w-52">
          <Filter className="h-4 w-4 text-gray-400 shrink-0 hidden sm:block" />
          <select
            value={filters.category || ''}
            onChange={handleCategoryChange}
            className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
          >
            <option value="">All Categories</option>
            {DOCUMENT_CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>

        {/* Status Filter */}
        <div className="sm:w-44">
          <select
            value={filters.status || ''}
            onChange={handleStatusChange}
            className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
          >
            <option value="">All Statuses</option>
            <option value="ready">Ready (Summarized)</option>
            <option value="processing">Processing (AI)</option>
            <option value="error">Failed</option>
          </select>
        </div>
      </div>

      {/* Processing Banner */}
      {hasProcessing && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-3.5 flex items-center justify-between text-amber-800 text-xs">
          <div className="flex items-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin text-amber-600" />
            <span className="font-medium">
              Background AI worker is actively summarizing documents... Refreshing automatically.
            </span>
          </div>
          <span className="text-amber-600 font-mono">Live Sync ON</span>
        </div>
      )}

      {/* Document Grid */}
      {isLoading && documents.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-gray-400 space-y-3">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          <p className="text-sm font-medium">Loading documents...</p>
        </div>
      ) : documents.length === 0 ? (
        <div className="bg-white border-2 border-dashed border-gray-200 rounded-2xl p-12 text-center max-w-lg mx-auto space-y-4">
          <div className="w-14 h-14 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mx-auto">
            <FileText className="h-7 w-7" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-gray-900">No documents found</h3>
            <p className="text-xs text-gray-500 mt-1 max-w-xs mx-auto">
              {filters.search || filters.category || filters.status
                ? 'Try clearing your search query or filters.'
                : 'Upload your first PDF or Markdown document to get started.'}
            </p>
          </div>
          <button
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-xs font-semibold rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
          >
            <Plus className="h-3.5 w-3.5" />
            Upload Document
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between text-xs text-gray-500 font-medium px-1">
            <span>
              Showing {documents.length} of {total} document{total === 1 ? '' : 's'}
            </span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {documents.map((doc) => (
              <DocumentCard key={doc.id} document={doc} />
            ))}
          </div>
        </div>
      )}

      {/* Upload Modal */}
      <UploadModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </div>
  );
};
