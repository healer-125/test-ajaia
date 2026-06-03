import sanitizeHtml from 'sanitize-html';

// The TipTap StarterKit + Underline can produce these tags. We deliberately
// keep the allow-list tight so persisted documents cannot smuggle scripts,
// event handlers, or styling that would break rendering for other users.
const ALLOWED_TAGS = [
  'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
  'p', 'br', 'hr',
  'strong', 'b', 'em', 'i', 'u', 's', 'strike',
  'ul', 'ol', 'li',
  'blockquote', 'code', 'pre',
  'a',
];

/** Sanitizes editor HTML before persisting it. */
export function sanitizeDocumentHtml(dirty: string): string {
  return sanitizeHtml(dirty ?? '', {
    allowedTags: ALLOWED_TAGS,
    allowedAttributes: {
      a: ['href', 'target', 'rel'],
    },
    allowedSchemes: ['http', 'https', 'mailto'],
    transformTags: {
      a: sanitizeHtml.simpleTransform('a', {
        rel: 'noopener noreferrer',
        target: '_blank',
      }),
    },
  });
}
