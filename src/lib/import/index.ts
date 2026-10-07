import { api, isApiError } from '../api';
import type { CVLang } from '../../types/cv';
import { checkSize, detectKind } from './detect';
import { isEmptyImport, normalizeImported } from './normalize';
import { ImportError, type ImportResult, type ImportSource, type Prepared } from './types';

export { ACCEPTED_EXTENSIONS } from './detect';
export { ImportError } from './types';
export type { ImportErrorCode, ImportResult, MissingPart } from './types';

/** The backend accepts 60 000 characters; stay under it. */
export const MAX_AI_TEXT_CHARS = 58_000;

function finish(raw: unknown, source: ImportSource): ImportResult {
  const { data, missing } = normalizeImported(raw);
  if (isEmptyImport(data)) throw new ImportError('empty');
  return { data, source, missing };
}

/** Reads a file in the browser. Known formats come back as a CV; the rest as text for the AI. */
export async function prepareImport(file: File, lang: CVLang): Promise<Prepared> {
  const bytes = new Uint8Array(await file.arrayBuffer());
  const kind = detectKind(file.name, bytes.subarray(0, 64));
  checkSize(kind, bytes.byteLength);

  if (kind === 'pdf') {
    const { extractPdfText } = await import('./pdfText');
    return { kind: 'needsAi', text: await extractPdfText(bytes), source: 'pdf' };
  }

  if (kind === 'zip') {
    const { parseLinkedinZip } = await import('./linkedinZip');
    return { kind: 'ready', result: finish(await parseLinkedinZip(bytes, lang), 'linkedin') };
  }

  const text = new TextDecoder().decode(bytes).replace(/^\uFEFF/, '');
  const { parseStructured, mapStructured } = await import('./structured');
  const mapped = mapStructured(await parseStructured(text, kind));
  if (mapped) return { kind: 'ready', result: finish(mapped.data, mapped.source) };
  return { kind: 'needsAi', text, source: 'structured' };
}

/** Sends extracted text to the AI import endpoint. */
export async function runAiImport(
  prepared: Extract<Prepared, { kind: 'needsAi' }>,
  lang: CVLang,
  token: string | null
): Promise<ImportResult> {
  if (!token) throw new ImportError('needsAuth');
  try {
    const response = await api.importCV(
      { text: prepared.text.slice(0, MAX_AI_TEXT_CHARS), source: prepared.source, language: lang },
      token
    );
    return { ...finish(response.cv, 'ai'), remainingFreeImports: response.remaining_free_imports };
  } catch (error) {
    if (error instanceof ImportError) throw error;
    if (isApiError(error, 401)) throw new ImportError('needsAuth');
    if (isApiError(error, 403)) throw new ImportError('limit');
    if (isApiError(error, 429)) throw new ImportError('rateLimited');
    if (isApiError(error, 422)) throw new ImportError('empty');
    throw new ImportError('failed');
  }
}

/**
 * Imports a CV from a file. `getToken` is only called when the file needs the AI
 * (PDFs and unknown data formats); it should resolve to null for guests.
 */
export async function importFile(
  file: File,
  options: { lang: CVLang; getToken: () => Promise<string | null> }
): Promise<ImportResult> {
  let prepared: Prepared;
  try {
    prepared = await prepareImport(file, options.lang);
  } catch (error) {
    throw error instanceof ImportError ? error : new ImportError('unreadable');
  }
  if (prepared.kind === 'ready') return prepared.result;
  return runAiImport(prepared, options.lang, await options.getToken());
}
