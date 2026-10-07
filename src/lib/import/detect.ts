import { ImportError, type ImportKind } from './types';

export const MAX_PDF_BYTES = 10 * 1024 * 1024;
export const MAX_ZIP_BYTES = 30 * 1024 * 1024;
export const MAX_TEXT_BYTES = 2 * 1024 * 1024;

/** Extensions offered in the file picker. */
export const ACCEPTED_EXTENSIONS = '.pdf,.zip,.json,.yaml,.yml,.toml,.xml';

const BY_EXTENSION: Record<string, ImportKind> = {
  pdf: 'pdf',
  zip: 'zip',
  json: 'json',
  yaml: 'yaml',
  yml: 'yaml',
  toml: 'toml',
  xml: 'xml',
};

const LIMITS: Record<ImportKind, number> = {
  pdf: MAX_PDF_BYTES,
  zip: MAX_ZIP_BYTES,
  json: MAX_TEXT_BYTES,
  yaml: MAX_TEXT_BYTES,
  toml: MAX_TEXT_BYTES,
  xml: MAX_TEXT_BYTES,
};

const startsWith = (bytes: Uint8Array, signature: number[]) =>
  signature.every((byte, index) => bytes[index] === byte);

/**
 * Decides how to read a file. The content wins over the extension for binary formats
 * (a PDF renamed to .json is still a PDF); text formats are told apart by extension.
 */
export function detectKind(fileName: string, head: Uint8Array): ImportKind {
  if (startsWith(head, [0x25, 0x50, 0x44, 0x46])) return 'pdf'; // %PDF
  if (startsWith(head, [0x50, 0x4b, 0x03, 0x04])) return 'zip'; // PK..

  const extension = fileName.toLowerCase().split('.').pop() || '';
  const byExtension = BY_EXTENSION[extension];
  // The signature checks above did not match, so a "pdf" or "zip" here is not one
  if (byExtension && byExtension !== 'pdf' && byExtension !== 'zip') return byExtension;
  if (byExtension) throw new ImportError('unreadable');

  // No usable extension: sniff the first visible character
  const first = new TextDecoder()
    .decode(head)
    .replace(/^\uFEFF/, '')
    .trimStart()[0];
  if (first === '{' || first === '[') return 'json';
  if (first === '<') return 'xml';
  throw new ImportError('unsupported');
}

export function checkSize(kind: ImportKind, size: number): void {
  if (size === 0) throw new ImportError('unreadable');
  if (size > LIMITS[kind]) throw new ImportError('tooLarge');
}
