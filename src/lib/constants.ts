// URLs for external resources
export const BLOG_URL = typeof import.meta !== 'undefined' && import.meta.env?.DEV
  ? 'http://localhost:4321/docs/blog'
  : '/docs/blog'; // Combined build serves blog at /docs/blog

export const DOCS_URL = typeof import.meta !== 'undefined' && import.meta.env?.DEV
  ? 'http://localhost:4321/docs'
  : '/docs'; // Combined build serves docs at /docs
