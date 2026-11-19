import { create } from 'zustand';
import { api } from '../services/api';
import { DocumentMetadata, ApiResponse } from '../types';

interface DocumentFilter {
  search?: string;
  category?: string;
  tag?: string;
  status?: string;
  page?: number;
  limit?: number;
}

interface DocumentState {
  documents: DocumentMetadata[];
  total: number;
  page: number;
  totalPages: number;
  isLoading: boolean;
  isUploading: boolean;
  error: string | null;
  filters: DocumentFilter;
  selectedDoc: DocumentMetadata | null;

  setFilters: (filters: Partial<DocumentFilter>) => void;
  fetchDocuments: () => Promise<void>;
  fetchDocumentById: (id: string) => Promise<DocumentMetadata>;
  uploadDocument: (file: File, meta: { title: string; description?: string; category: string; tags: string[] }) => Promise<DocumentMetadata>;
  updateDocument: (id: string, updates: { title?: string; description?: string; category?: string; tags?: string[] }) => Promise<void>;
  deleteDocument: (id: string) => Promise<void>;
  downloadDocument: (id: string, fileName: string) => Promise<void>;
}

export const useDocumentStore = create<DocumentState>((set, get) => ({
  documents: [],
  total: 0,
  page: 1,
  totalPages: 1,
  isLoading: false,
  isUploading: false,
  error: null,
  filters: { page: 1, limit: 20 },
  selectedDoc: null,

  setFilters: (newFilters) => {
    set((state) => ({
      filters: { ...state.filters, ...newFilters },
    }));
    get().fetchDocuments();
  },

  fetchDocuments: async () => {
    set({ isLoading: true, error: null });
    try {
      const { filters } = get();
      const params = new URLSearchParams();
      if (filters.search) params.append('search', filters.search);
      if (filters.category) params.append('category', filters.category);
      if (filters.tag) params.append('tag', filters.tag);
      if (filters.status) params.append('status', filters.status);
      if (filters.page) params.append('page', String(filters.page));
      if (filters.limit) params.append('limit', String(filters.limit));

      const res = await api.get<ApiResponse<DocumentMetadata[]>>(`/documents?${params.toString()}`);
      if (res.data.success && res.data.data) {
        set({
          documents: res.data.data,
          total: res.data.meta?.total || 0,
          page: res.data.meta?.page || 1,
          totalPages: res.data.meta?.totalPages || 1,
          isLoading: false,
        });
      }
    } catch (err: any) {
      set({
        isLoading: false,
        error: err.response?.data?.error?.message || err.message || 'Failed to fetch documents',
      });
    }
  },

  fetchDocumentById: async (id: string) => {
    try {
      const res = await api.get<ApiResponse<DocumentMetadata>>(`/documents/${id}`);
      if (res.data.success && res.data.data) {
        set({ selectedDoc: res.data.data });
        return res.data.data;
      }
      throw new Error('Document not found');
    } catch (err: any) {
      throw err;
    }
  },

  uploadDocument: async (file, meta) => {
    set({ isUploading: true, error: null });
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('title', meta.title);
      if (meta.description) formData.append('description', meta.description);
      formData.append('category', meta.category);
      formData.append('tags', meta.tags.join(','));

      const res = await api.post<ApiResponse<DocumentMetadata>>('/documents/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (res.data.success && res.data.data) {
        const newDoc = res.data.data;
        set((state) => ({
          documents: [newDoc, ...state.documents],
          isUploading: false,
        }));
        return newDoc;
      }
      throw new Error(res.data.error?.message || 'Upload failed');
    } catch (err: any) {
      set({
        isUploading: false,
        error: err.response?.data?.error?.message || err.message || 'Upload failed',
      });
      throw err;
    }
  },

  updateDocument: async (id, updates) => {
    try {
      const res = await api.put<ApiResponse<DocumentMetadata>>(`/documents/${id}`, updates);
      if (res.data.success && res.data.data) {
        const updated = res.data.data;
        set((state) => ({
          documents: state.documents.map((d) => (d.id === id ? updated : d)),
          selectedDoc: state.selectedDoc?.id === id ? updated : state.selectedDoc,
        }));
      }
    } catch (err: any) {
      throw err;
    }
  },

  deleteDocument: async (id) => {
    try {
      await api.delete(`/documents/${id}`);
      set((state) => ({
        documents: state.documents.filter((d) => d.id !== id),
        selectedDoc: state.selectedDoc?.id === id ? null : state.selectedDoc,
      }));
    } catch (err: any) {
      throw err;
    }
  },

  downloadDocument: async (id, fileName) => {
    try {
      const res = await api.get(`/documents/${id}/download`, {
        responseType: 'blob',
      });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', fileName);
      document.body.appendChild(link);
      link.click();
      link.parentNode?.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err: any) {
      throw err;
    }
  },
}));
