export type DocumentStatus = 'uploading' | 'processing' | 'ready' | 'error';

export interface DocumentMetadata {
  id: string;
  userId: string;
  title: string;
  description?: string;
  category: string;
  tags: string[];
  fileName: string;
  fileSize: number;
  mimeType: string;
  s3Key: string;
  status: DocumentStatus;
  summary?: string;
  createdAt: string;
  updatedAt: string;
}

export interface User {
  id: string;
  email: string;
  displayName: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: unknown;
  };
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
    totalPages?: number;
  };
}

export const DOCUMENT_CATEGORIES = [
  'Technical',
  'Business',
  'Research',
  'Personal',
  'Legal',
  'Finance',
  'Other',
] as const;

export type DocumentCategory = typeof DOCUMENT_CATEGORIES[number];
