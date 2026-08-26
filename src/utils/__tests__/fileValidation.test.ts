import { describe, it, expect } from 'vitest';
import { validateImageFile, validateImageUrl, MAX_FILE_SIZE_BYTES } from '../fileValidation';

describe('File & URL Validation Utilities', () => {
  describe('validateImageFile', () => {
    it('accepts valid supported image files (PNG, JPG, WebP)', () => {
      const pngFile = new File(['mock-bytes'], 'screenshot.png', { type: 'image/png' });
      expect(validateImageFile(pngFile)).toEqual({ valid: true });

      const jpegFile = new File(['mock-bytes'], 'scene.jpg', { type: 'image/jpeg' });
      expect(validateImageFile(jpegFile)).toEqual({ valid: true });

      const webpFile = new File(['mock-bytes'], 'anime.webp', { type: 'image/webp' });
      expect(validateImageFile(webpFile)).toEqual({ valid: true });
    });

    it('rejects null or undefined files with clear error message', () => {
      expect(validateImageFile(null).valid).toBe(false);
      expect(validateImageFile(undefined).valid).toBe(false);
      expect(validateImageFile(null).error).toContain('No file provided');
    });

    it('rejects empty (0 byte) files', () => {
      const emptyFile = new File([], 'empty.png', { type: 'image/png' });
      const result = validateImageFile(emptyFile);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('empty');
    });

    it('rejects unsupported file formats like executable, text, or pdf', () => {
      const pdfFile = new File(['%PDF-1.4'], 'document.pdf', { type: 'application/pdf' });
      const result = validateImageFile(pdfFile);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('Unsupported file format');

      const textFile = new File(['hello'], 'notes.txt', { type: 'text/plain' });
      expect(validateImageFile(textFile).valid).toBe(false);
    });

    it('rejects oversized files exceeding 25MB limit', () => {
      const oversizedBlob = new Blob([new Uint8Array(MAX_FILE_SIZE_BYTES + 1024)]);
      const oversizedFile = new File([oversizedBlob], 'huge.png', { type: 'image/png' });

      const result = validateImageFile(oversizedFile);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('exceeds maximum limit');
    });
  });

  describe('validateImageUrl', () => {
    it('accepts valid HTTPS and HTTP image URLs', () => {
      expect(validateImageUrl('https://example.com/screenshot.jpg')).toEqual({ valid: true });
      expect(validateImageUrl('http://domain.org/frame.png')).toEqual({ valid: true });
    });

    it('rejects empty, null, or blank URLs', () => {
      expect(validateImageUrl('').valid).toBe(false);
      expect(validateImageUrl('   ').valid).toBe(false);
      expect(validateImageUrl(null).valid).toBe(false);
    });

    it('rejects invalid or unsafe URL schemes', () => {
      expect(validateImageUrl('javascript:alert(1)').valid).toBe(false);
      expect(validateImageUrl('ftp://files.example.com/image.jpg').valid).toBe(false);
      expect(validateImageUrl('not-a-url').valid).toBe(false);
    });
  });
});
