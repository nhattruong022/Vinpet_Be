// eslint-disable-next-line @typescript-eslint/no-var-requires
const MarkdownIt = require('markdown-it');

// Initialize markdown-it instance
const md = new MarkdownIt({
  html: true, // Enable HTML tags in source
  breaks: true, // Convert '\n' in paragraphs into <br>
  linkify: true // Autoconvert URL-like text to links
});

/**
 * Convert markdown text to HTML
 * @param markdown - Markdown text to convert
 * @returns HTML string
 */
export function markdownToHtml(markdown: string | undefined): string {
  if (!markdown) {
    return '';
  }

  try {
    return md.render(markdown);
  } catch (error) {
    console.error('Error converting markdown to HTML:', error);
    // Return original markdown if conversion fails
    return markdown;
  }
}

