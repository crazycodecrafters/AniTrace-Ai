import { describe, it, expect } from 'vitest';
import { sanitizeHtml, escapeHtml, isSafeUrl } from '../sanitize';

describe('Sanitization & Security Utilities', () => {
  describe('escapeHtml', () => {
    it('escapes special characters to HTML entities', () => {
      expect(escapeHtml('<script>alert("xss")</script>')).toBe(
        '&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;'
      );
      expect(escapeHtml("Tom & 'Jerry'")).toBe('Tom &amp; &#039;Jerry&#039;');
    });

    it('handles empty or null input gracefully', () => {
      expect(escapeHtml('')).toBe('');
    });
  });

  describe('sanitizeHtml', () => {
    it('strips malicious script and iframe tags', () => {
      const malicious = '<script>alert(1)</script><p>Hello</p><iframe src="malicious.com"></iframe>';
      const sanitized = sanitizeHtml(malicious);
      expect(sanitized).not.toContain('<script>');
      expect(sanitized).not.toContain('<iframe>');
      expect(sanitized).toContain('<p>Hello</p>');
    });

    it('removes inline event handlers like onclick and onerror', () => {
      const payload = '<img src="invalid" onerror="alert(1)" /><span onclick="steal()">Click</span>';
      const sanitized = sanitizeHtml(payload);
      expect(sanitized).not.toContain('onerror');
      expect(sanitized).not.toContain('onclick');
    });

    it('preserves safe formatting tags', () => {
      const safe = '<b>Bold</b> and <i>Italic</i><br />Text with <code>code</code>';
      const sanitized = sanitizeHtml(safe);
      expect(sanitized).toBe('<b>Bold</b> and <i>Italic</i><br />Text with <code>code</code>');
    });

    it('normalizes <br> tags', () => {
      const text = 'Line 1<br>Line 2<br/>Line 3';
      const sanitized = sanitizeHtml(text);
      expect(sanitized).toContain('<br />');
    });
  });

  describe('isSafeUrl', () => {
    it('allows valid http and https URLs', () => {
      expect(isSafeUrl('https://images.weserv.nl/test.jpg')).toBe(true);
      expect(isSafeUrl('http://example.com/anime.png')).toBe(true);
    });

    it('rejects javascript: and dangerous schemes', () => {
      expect(isSafeUrl('javascript:alert(1)')).toBe(false);
      expect(isSafeUrl('data:text/html,<script>alert(1)</script>')).toBe(false);
      expect(isSafeUrl('file:///etc/passwd')).toBe(false);
      expect(isSafeUrl('vbscript:msgbox(1)')).toBe(false);
      expect(isSafeUrl('')).toBe(false);
      expect(isSafeUrl('not a url')).toBe(false);
    });
  });
});
