import type { Translation } from '../../i18n/locales';
import type { ImportResult } from './types';

/** "We could not find: experience, skills…" or '' when nothing is missing. */
export const missingNotice = (t: Translation, result: ImportResult): string =>
  result.missing.length === 0
    ? ''
    : t.import.missingNotice.replace(
        '{parts}',
        result.missing.map((part) => t.import.missing[part]).join(', ')
      );

/** Title for a CV created from an import: the person's name, else the file name. */
export const importedTitle = (t: Translation, result: ImportResult, fileName: string): string =>
  result.data.personal.name || fileName.replace(/\.[^.]+$/, '').trim() || t.import.importedTitle;
