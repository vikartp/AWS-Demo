export const APP_NAME = 'DocuMind';

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

export const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10MB
export const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'text/plain',
  'text/markdown',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
] as const;

export const PAGINATION_DEFAULTS = {
  PAGE: 1,
  LIMIT: 20,
  MAX_LIMIT: 100,
} as const;

export const API_ROUTES = {
  HEALTH: '/health',
  DOCUMENTS: '/api/documents',
  AI: '/api/ai',
  USERS: '/api/users',
  AUTH: '/api/auth',
} as const;
