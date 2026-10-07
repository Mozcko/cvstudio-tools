/**
 * Reading candidates' CVs in the recruiter's browser. Files are never uploaded: what leaves the
 * browser is the text extracted here.
 *
 * Supported: PDF, Word (.docx), OpenDocument (.odt), rich text (.rtf) and plain text.
 */

export type CandidateFileError =
  | 'unsupported' // not a format we read
  | 'legacyDoc' // old binary Word (.doc)
  | 'tooLarge'
  | 'unreadable' // corrupt, or protected with a password
  | 'noText' // a scan, or an empty document
  | 'tooShort'; // too little text to be a CV

export class CandidateFileProblem extends Error {
  code: CandidateFileError;

  constructor(code: CandidateFileError) {
    super(code);
    this.name = 'CandidateFileProblem';
    this.code = code;
  }
}

export const MAX_FILE_BYTES = 10 * 1024 * 1024;
/** The backend accepts 60 000 characters and needs at least 80. */
export const MAX_TEXT_CHARS = 58_000;
export const MIN_TEXT_CHARS = 80;

export const ACCEPTED_CV_FILES = '.pdf,.docx,.odt,.rtf,.txt,.md';

const startsWith = (bytes: Uint8Array, signature: number[]) =>
  signature.every((byte, index) => bytes[index] === byte);

const ENTITIES: Record<string, string> = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'" };

const decodeEntities = (text: string): string =>
  text.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (whole, code: string) => {
    if (code[0] === '#') {
      const point =
        code[1].toLowerCase() === 'x' ? parseInt(code.slice(2), 16) : Number(code.slice(1));
      return Number.isFinite(point) && point > 0 && point <= 0x10ffff
        ? String.fromCodePoint(point)
        : '';
    }
    return ENTITIES[code.toLowerCase()] ?? whole;
  });

const tidy = (text: string): string =>
  text
    .replace(/\r\n?/g, '\n')
    .replace(/[ \t\u00a0]+/g, ' ')
    .replace(/ *\n */g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();

/**
 * Drops everything between `<` and `>`. Done by walking the text once rather than with a
 * replacement, so no `<` can survive (a replacement can leave one behind: `<<a>b>`). An
 * unclosed tag swallows the rest.
 */
function withoutTags(xml: string): string {
  let out = '';
  let at = 0;
  while (at < xml.length) {
    const open = xml.indexOf('<', at);
    if (open === -1) return out + xml.slice(at);
    out += xml.slice(at, open);
    const close = xml.indexOf('>', open);
    if (close === -1) return out;
    at = close + 1;
  }
  return out;
}

/** Text of a Word document body (`word/document.xml`). */
export function docxXmlToText(xml: string): string {
  return tidy(
    decodeEntities(
      withoutTags(
        xml
          // Deleted text and field instructions are not what the reader sees
          .replace(/<w:delText[\s\S]*?<\/w:delText>/g, '')
          .replace(/<w:instrText[\s\S]*?<\/w:instrText>/g, '')
          .replace(/<w:tab\b[^>]*\/>/g, '\t')
          .replace(/<w:(?:br|cr)\b[^>]*\/>/g, '\n')
          .replace(/<\/w:tc>/g, '\t')
          .replace(/<\/w:(?:p|tr)>/g, '\n')
      )
    )
  );
}

/** Text of an OpenDocument body (`content.xml`). */
export function odtXmlToText(xml: string): string {
  const body = xml.includes('<office:body') ? xml.slice(xml.indexOf('<office:body')) : xml;
  return tidy(
    decodeEntities(
      withoutTags(
        body
          .replace(/<text:tracked-changes[\s\S]*?<\/text:tracked-changes>/g, '')
          .replace(/<text:tab\b[^>]*\/>/g, '\t')
          .replace(/<text:line-break\b[^>]*\/>/g, '\n')
          .replace(/<text:s\b[^>]*\/>/g, ' ')
          .replace(/<\/table:table-cell>/g, '\t')
          .replace(/<\/(?:text:p|text:h|table:table-row|text:list-item)>/g, '\n')
      )
    )
  );
}

// RTF groups that describe the document rather than being part of its text
const RTF_METADATA =
  /^\{\\(?:\*|fonttbl|colortbl|stylesheet|info|pict|themedata|generator|header|footer)\b/;

/** Removes whole `{...}` groups of metadata, following nested braces. */
function withoutRtfMetadata(rtf: string): string {
  let out = '';
  for (let i = 0; i < rtf.length; i++) {
    if (rtf[i] === '{' && RTF_METADATA.test(rtf.slice(i, i + 14))) {
      let depth = 0;
      for (; i < rtf.length; i++) {
        if (rtf[i] === '\\') i++;
        else if (rtf[i] === '{') depth++;
        else if (rtf[i] === '}' && --depth === 0) break;
      }
      continue;
    }
    out += rtf[i];
  }
  return out;
}

/** Rich text reduced to its words: metadata, control words and escapes removed. */
export function rtfToText(rtf: string): string {
  return tidy(
    withoutRtfMetadata(rtf)
      .replace(/\\par[d]?\b ?|\\line\b ?/g, '\n')
      .replace(/\\tab\b ?/g, '\t')
      .replace(/\\u(-?\d+)\??/g, (_, code: string) => {
        const point = Number(code) < 0 ? Number(code) + 65536 : Number(code);
        return String.fromCharCode(point);
      })
      .replace(/\\'([0-9a-f]{2})/gi, (_, hex: string) => String.fromCharCode(parseInt(hex, 16)))
      .replace(/\\[a-z]+-?\d* ?/gi, '')
      .replace(/\\([\\{}])/g, '$1')
      .replace(/[{}]/g, '')
  );
}

async function zipDocumentText(bytes: Uint8Array): Promise<string> {
  const { unzipSync, strFromU8 } = await import('fflate');
  let files: Record<string, Uint8Array>;
  try {
    // Only the document body is inflated; images and fonts are left alone
    files = unzipSync(bytes, {
      filter: (file) => file.name === 'word/document.xml' || file.name === 'content.xml',
    });
  } catch {
    throw new CandidateFileProblem('unreadable');
  }
  if (files['word/document.xml']) return docxXmlToText(strFromU8(files['word/document.xml']));
  if (files['content.xml']) return odtXmlToText(strFromU8(files['content.xml']));
  // A ZIP that is not a document (or a spreadsheet, a presentation…)
  throw new CandidateFileProblem('unsupported');
}

async function textOf(file: File, bytes: Uint8Array): Promise<string> {
  const extension = file.name.toLowerCase().split('.').pop() || '';

  if (startsWith(bytes, [0x25, 0x50, 0x44, 0x46])) {
    // %PDF
    const { extractPdfText } = await import('../import/pdfText');
    try {
      return await extractPdfText(bytes);
    } catch (error) {
      const code = (error as { code?: string }).code;
      throw new CandidateFileProblem(code === 'noText' ? 'noText' : 'unreadable');
    }
  }
  if (startsWith(bytes, [0x50, 0x4b, 0x03, 0x04])) return zipDocumentText(bytes); // PK.. (docx, odt)
  if (startsWith(bytes, [0xd0, 0xcf, 0x11, 0xe0])) throw new CandidateFileProblem('legacyDoc');

  const text = new TextDecoder().decode(bytes).replace(/^\uFEFF/, '');
  if (text.startsWith('{\\rtf')) return rtfToText(text);
  if (['txt', 'md', 'text'].includes(extension)) return tidy(text);
  // Said to be one of ours, but the content is something else
  if (['pdf', 'docx', 'odt', 'rtf'].includes(extension))
    throw new CandidateFileProblem('unreadable');
  throw new CandidateFileProblem('unsupported');
}

/** The text of a CV file, ready to be evaluated. Throws CandidateFileProblem with the reason. */
export async function readCandidateFile(file: File): Promise<string> {
  if (file.size > MAX_FILE_BYTES) throw new CandidateFileProblem('tooLarge');
  if (file.size === 0) throw new CandidateFileProblem('noText');

  const bytes = new Uint8Array(await file.arrayBuffer());
  let text: string;
  try {
    text = await textOf(file, bytes);
  } catch (error) {
    throw error instanceof CandidateFileProblem ? error : new CandidateFileProblem('unreadable');
  }

  if (text.replace(/\s/g, '').length === 0) throw new CandidateFileProblem('noText');
  if (text.length < MIN_TEXT_CHARS) throw new CandidateFileProblem('tooShort');
  return text.slice(0, MAX_TEXT_CHARS);
}
