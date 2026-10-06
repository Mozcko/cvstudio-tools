/**
 * Prints an HTML fragment through the browser's own print engine, from a hidden iframe.
 * The user picks "Save as PDF" in the dialog, which gives a PDF with real, selectable text
 * and exactly the CSS the browser renders (pseudo-elements, flexbox, web fonts...).
 */

export interface PrintOptions {
  /** Suggested file name (browsers use the document title for it). */
  title: string;
  /** Stylesheet for the content, e.g. a CV theme. */
  css: string;
  /** Inner HTML of the document body. */
  html: string;
  /** Extra class for the wrapper element (themes are scoped under .cv-preview-content). */
  wrapperClass?: string;
}

// The on-screen preview lives inside the app, where Tailwind's preflight reset applies and the
// themes were written against it. The print document has no Tailwind, so it carries the same
// reset; otherwise browser defaults (list bullets, heading sizes, margins) would change the look.
const PREFLIGHT_CSS = `
  *, ::before, ::after { box-sizing: border-box; margin: 0; padding: 0; border: 0 solid; }
  html { line-height: 1.5; -webkit-text-size-adjust: 100%;
         font-family: ui-sans-serif, system-ui, sans-serif, 'Apple Color Emoji', 'Segoe UI Emoji'; }
  h1, h2, h3, h4, h5, h6 { font-size: inherit; font-weight: inherit; }
  a { color: inherit; text-decoration: inherit; }
  b, strong { font-weight: bolder; }
  ol, ul, menu { list-style: none; }
  table { text-indent: 0; border-color: inherit; border-collapse: collapse; }
  img, svg { display: block; vertical-align: middle; max-width: 100%; height: auto; }
  hr { height: 0; color: inherit; border-top-width: 1px; }
`;

const BASE_PRINT_CSS = `
  @page { size: A4; margin: 1cm; }
  html, body { background: #fff; }
  body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
`;

// Applied after the theme: the page margin replaces the on-screen sheet padding
const PRINT_OVERRIDES_CSS = `
  .print-root { padding: 0 !important; margin: 0 !important; width: auto !important;
                min-height: 0 !important; max-width: none !important; box-shadow: none !important; }
`;

const escapeHtml = (value: string) =>
  value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

export function buildPrintDocument({ title, css, html, wrapperClass = '' }: PrintOptions): string {
  return `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <title>${escapeHtml(title)}</title>
    <style>${PREFLIGHT_CSS}${BASE_PRINT_CSS}</style>
    <style>${css}</style>
    <style>${PRINT_OVERRIDES_CSS}</style>
  </head>
  <body>
    <div class="print-root ${wrapperClass}">${html}</div>
  </body>
</html>`;
}

export function printHtml(options: PrintOptions): Promise<void> {
  return new Promise((resolve) => {
    const iframe = document.createElement('iframe');
    iframe.setAttribute('aria-hidden', 'true');
    Object.assign(iframe.style, {
      position: 'fixed',
      right: '0',
      bottom: '0',
      width: '0',
      height: '0',
      border: '0',
      visibility: 'hidden',
    });

    const previousTitle = document.title;
    let finished = false;
    const cleanup = () => {
      if (finished) return;
      finished = true;
      document.title = previousTitle;
      // Give the print job a moment before the document goes away
      setTimeout(() => iframe.remove(), 500);
      resolve();
    };

    iframe.onload = async () => {
      const frameWindow = iframe.contentWindow;
      if (!frameWindow) return cleanup();

      try {
        await frameWindow.document.fonts?.ready;
      } catch {
        // Fonts API unavailable: print with whatever is loaded
      }

      // Some browsers name the file after the top-level document
      document.title = options.title;
      frameWindow.addEventListener('afterprint', cleanup, { once: true });
      // Fallback for browsers that never fire afterprint on iframes
      setTimeout(cleanup, 60_000);

      frameWindow.focus();
      frameWindow.print();
    };

    iframe.srcdoc = buildPrintDocument(options);
    document.body.appendChild(iframe);
  });
}
