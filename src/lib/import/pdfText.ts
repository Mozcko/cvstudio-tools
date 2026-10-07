import { ImportError } from './types';

export const MAX_PDF_PAGES = 15;
/** Fewer characters than this in a whole document means there is no real text layer. */
const MIN_TEXT_CHARS = 80;

/** Text of a PDF, page by page, in the order the document stores it. Runs in the browser. */
export async function extractPdfText(bytes: Uint8Array): Promise<string> {
  const [pdfjs, { default: workerUrl }] = await Promise.all([
    import('pdfjs-dist'),
    import('pdfjs-dist/build/pdf.worker.min.mjs?url'),
  ]);
  pdfjs.GlobalWorkerOptions.workerSrc = workerUrl;

  const loading = pdfjs.getDocument({ data: bytes });
  let document;
  try {
    document = await loading.promise;
  } catch {
    // Corrupt, or protected with a password
    await loading.destroy();
    throw new ImportError('unreadable');
  }

  try {
    const pages: string[] = [];
    for (let number = 1; number <= Math.min(document.numPages, MAX_PDF_PAGES); number++) {
      const page = await document.getPage(number);
      const content = await page.getTextContent();
      let text = '';
      for (const item of content.items) {
        if (!('str' in item)) continue;
        text += item.str;
        text += item.hasEOL ? '\n' : item.str.endsWith(' ') ? '' : ' ';
      }
      pages.push(text.replace(/[ \t]+\n/g, '\n').trim());
    }

    const text = pages.join('\n\n').trim();
    if (text.replace(/\s/g, '').length < MIN_TEXT_CHARS) throw new ImportError('noText');
    return text;
  } finally {
    await loading.destroy();
  }
}
