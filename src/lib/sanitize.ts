/**
 * HTML Sanitization and Safety Utility
 * Strips dangerous HTML tags/attributes and formats safe text for rendering.
 */

/**
 * Escapes HTML entities to prevent XSS
 */
export function escapeHtml(str: string): string {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Safely sanitizes HTML content containing basic formatting tags (like <br>, <i>, <b>, <em>, <strong>, <p>)
 * and strips any dangerous tags (like <script>, <iframe>, <object>, <embed>, <a> with javascript: URLs, event handlers).
 */
export function sanitizeHtml(html: string | null | undefined): string {
  if (!html) return '';

  // 1. Normalize linebreaks and remove script/iframe/style/event handlers
  let cleaned = html
    .replace(/<br\s*\/?>/gi, '<br />')
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
    .replace(/on\w+="[^"]*"/gi, '')
    .replace(/on\w+='[^']*'/gi, '')
    .replace(/javascript:/gi, '');

  // 2. Allow only safe tags: b, i, em, strong, br, p, span, ul, ol, li, code
  cleaned = cleaned.replace(/<(\/?)(\w+)([^>]*)>/gi, (_match, close, tagName, attrs) => {
    const safeTags = ['b', 'i', 'em', 'strong', 'br', 'p', 'span', 'ul', 'ol', 'li', 'code'];
    const lowerTag = tagName.toLowerCase();
    
    if (!safeTags.includes(lowerTag)) {
      return ''; // Strip non-whitelisted tag
    }

    if (close) {
      return `</${lowerTag}>`;
    }

    if (lowerTag === 'br') {
      return '<br />';
    }

    // Strip unsafe attributes
    const safeAttrs = attrs.replace(/(style|class|id|href|src|onclick|onerror)=["'][^"']*["']/gi, '');
    return `<${lowerTag}${safeAttrs}>`;
  });

  return cleaned;
}

/**
 * Validates whether a given URL is safe for image fetching or linking (http/https only)
 */
export function isSafeUrl(url: string): boolean {
  if (!url || typeof url !== 'string') return false;
  const trimmed = url.trim().toLowerCase();
  
  // Reject dangerous schemes
  if (
    trimmed.startsWith('javascript:') ||
    trimmed.startsWith('data:') ||
    trimmed.startsWith('file:') ||
    trimmed.startsWith('vbscript:')
  ) {
    return false;
  }

  try {
    const parsed = new URL(url);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}
