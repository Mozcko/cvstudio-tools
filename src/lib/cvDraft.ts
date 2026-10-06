import type { CVData } from '../types/cv';

/**
 * Local drafts. Each CV has its own entry in localStorage, keyed by its backend id;
 * a CV that has never been saved (including everything a guest does) lives under `new`.
 */

export interface CVDraft {
  data: CVData;
  themeId: string;
  title: string;
  /** Which editor the user was in, and the Markdown they had when it was the code editor. */
  mode: 'form' | 'code';
  markdown: string;
  /** True while the draft has changes the server does not have yet. */
  dirty: boolean;
  updatedAt: number;
}

type DraftStorage = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>;

const PREFIX = 'cv-draft:';
export const NEW_DRAFT_ID = 'new';

export const draftKey = (id: string | null | undefined) => `${PREFIX}${id || NEW_DRAFT_ID}`;

const getStorage = (): DraftStorage | null =>
  typeof window === 'undefined' ? null : window.localStorage;

export function readDraft(
  id: string | null | undefined,
  storage: DraftStorage | null = getStorage()
): CVDraft | null {
  if (!storage) return null;
  try {
    const raw = storage.getItem(draftKey(id));
    if (!raw) return null;
    const draft = JSON.parse(raw) as Partial<CVDraft>;
    if (!draft || typeof draft !== 'object' || !draft.data) return null;
    return {
      data: draft.data,
      themeId: draft.themeId || '',
      title: draft.title || '',
      mode: draft.mode === 'code' ? 'code' : 'form',
      markdown: draft.markdown || '',
      dirty: !!draft.dirty,
      updatedAt: draft.updatedAt || 0,
    };
  } catch (error) {
    console.warn('Could not read CV draft', error);
    return null;
  }
}

export function writeDraft(
  id: string | null | undefined,
  draft: CVDraft,
  storage: DraftStorage | null = getStorage()
): void {
  if (!storage) return;
  try {
    storage.setItem(draftKey(id), JSON.stringify(draft));
  } catch (error) {
    // Quota exceeded or storage disabled: the editor keeps working from memory
    console.warn('Could not store CV draft', error);
  }
}

export function removeDraft(
  id: string | null | undefined,
  storage: DraftStorage | null = getStorage()
): void {
  if (!storage) return;
  try {
    storage.removeItem(draftKey(id));
  } catch (error) {
    console.warn('Could not remove CV draft', error);
  }
}

const LEGACY_KEYS = ['cv-data', 'cv-resume-id', 'cv-theme-id', 'cv-custom-css'];

/**
 * Before per-CV drafts there was a single draft spread over four keys. Move it to the new
 * layout once and delete the old keys. `resolveThemeId` maps the stored theme (the old
 * code kept the full CSS text next to an id that could disagree with it) to a valid id.
 */
export function migrateLegacyDraft(
  resolveThemeId: (storedId: string | null, storedCss: string | null) => string,
  storage: DraftStorage | null = getStorage()
): void {
  if (!storage) return;
  try {
    const rawData = storage.getItem('cv-data');
    if (rawData === null) return;

    const parse = (value: string | null) => {
      if (value === null) return null;
      try {
        return JSON.parse(value);
      } catch {
        return null;
      }
    };

    const data = parse(rawData) as CVData | null;
    const storedId = parse(storage.getItem('cv-resume-id'));
    const id = typeof storedId === 'string' && storedId && storedId !== 'null' ? storedId : null;

    if (data && typeof data === 'object' && !storage.getItem(draftKey(id))) {
      writeDraft(
        id,
        {
          data,
          themeId: resolveThemeId(
            parse(storage.getItem('cv-theme-id')),
            parse(storage.getItem('cv-custom-css'))
          ),
          title: '',
          mode: 'form',
          markdown: '',
          // An unsaved draft must be kept; a saved one may be stale, so the server copy wins
          dirty: id === null,
          updatedAt: Date.now(),
        },
        storage
      );
    }

    LEGACY_KEYS.forEach((key) => storage.removeItem(key));
  } catch (error) {
    console.warn('Could not migrate the old CV draft', error);
  }
}
