import type { CVData } from '../../types/cv';

/** What a file looks like, decided from its name and first bytes. */
export type ImportKind = 'pdf' | 'zip' | 'json' | 'yaml' | 'toml' | 'xml';

export type ImportSource = 'linkedin' | 'json-resume' | 'rendercv' | 'cvstudio' | 'ai';

/** Parts of a CV that the import could not fill. */
export type MissingPart = 'name' | 'experience' | 'education' | 'skills';

export type ImportErrorCode =
  | 'unsupported' // not a format we read
  | 'tooLarge'
  | 'unreadable' // corrupt file or invalid syntax
  | 'noText' // PDF without a text layer (a scan)
  | 'notLinkedin' // a ZIP that is not a LinkedIn data export
  | 'empty' // nothing that looks like a CV
  | 'needsAuth' // this format needs AI, which needs an account
  | 'limit' // free AI imports used up
  | 'rateLimited'
  | 'failed';

export class ImportError extends Error {
  code: ImportErrorCode;

  constructor(code: ImportErrorCode) {
    super(code);
    this.name = 'ImportError';
    this.code = code;
  }
}

export interface ImportResult {
  data: CVData;
  source: ImportSource;
  missing: MissingPart[];
  /** Free AI imports left after this one (only when AI was used by a non-Pro user). */
  remainingFreeImports?: number | null;
}

/** Outcome of reading a file locally: either a finished CV, or text that needs the AI endpoint. */
export type Prepared =
  | { kind: 'ready'; result: ImportResult }
  | { kind: 'needsAi'; text: string; source: 'pdf' | 'structured' };
