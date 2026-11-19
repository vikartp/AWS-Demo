import { MAX_FILE_SIZE_BYTES, ALLOWED_MIME_TYPES, DOCUMENT_CATEGORIES } from '../constants/index.js';

export function validateFileSize(sizeBytes: number): boolean {
  return sizeBytes > 0 && sizeBytes <= MAX_FILE_SIZE_BYTES;
}

export function validateMimeType(mimeType: string): boolean {
  return (ALLOWED_MIME_TYPES as readonly string[]).includes(mimeType);
}

export function validateCategory(category: string): boolean {
  return (DOCUMENT_CATEGORIES as readonly string[]).includes(category);
}

export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export function validateTags(tags: string[]): boolean {
  return tags.length <= 10 && tags.every(tag => tag.length >= 1 && tag.length <= 50);
}

export function sanitizeString(input: string): string {
  return input.trim().replace(/<[^>]*>/g, '');
}
