/**
 * Utility functions for validating file inputs, formats, and sizes
 * ensuring safe and performant processing before inference.
 */

export const SUPPORTED_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'image/bmp',
] as const;

export const SUPPORTED_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp', '.gif', '.bmp'] as const;

export const MAX_FILE_SIZE_BYTES = 25 * 1024 * 1024; // 25 MB

export interface FileValidationResult {
  valid: boolean;
  error?: string;
}

/**
 * Validates whether a given File or Blob is safe, supported, and within size constraints.
 */
export function validateImageFile(file: File | null | undefined): FileValidationResult {
  if (!file) {
    return {
      valid: false,
      error: 'No file provided. Please select or drag-and-drop an anime screenshot.',
    };
  }

  if (file.size === 0) {
    return {
      valid: false,
      error: 'The selected file is empty (0 bytes). Please choose a valid image file.',
    };
  }

  if (file.size > MAX_FILE_SIZE_BYTES) {
    const sizeInMb = (file.size / (1024 * 1024)).toFixed(1);
    return {
      valid: false,
      error: `File size (${sizeInMb} MB) exceeds maximum limit of 25 MB.`,
    };
  }

  const mimeType = file.type.toLowerCase();
  const fileName = file.name.toLowerCase();
  
  const hasValidMime = SUPPORTED_MIME_TYPES.some((t) => mimeType === t);
  const hasValidExt = SUPPORTED_EXTENSIONS.some((ext) => fileName.endsWith(ext));

  if (!hasValidMime && !hasValidExt) {
    return {
      valid: false,
      error: `Unsupported file format "${file.type || 'unknown'}". Supported formats: PNG, JPG, WebP, GIF, BMP.`,
    };
  }

  return { valid: true };
}

/**
 * Validates direct image URLs for length, protocol scheme, and syntax.
 */
export function validateImageUrl(url: string | null | undefined): FileValidationResult {
  if (!url || !url.trim()) {
    return {
      valid: false,
      error: 'Please enter a valid image URL.',
    };
  }

  const trimmed = url.trim();

  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      return {
        valid: false,
        error: 'Only HTTP and HTTPS URLs are allowed for security.',
      };
    }
  } catch {
    return {
      valid: false,
      error: 'Invalid URL format. Please enter a full web address (e.g. https://example.com/image.jpg).',
    };
  }

  return { valid: true };
}
