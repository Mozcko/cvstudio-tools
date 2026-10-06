import { describe, expect, it } from 'vitest';
import { initialCVData } from '../../types/cv';
import {
  draftKey,
  migrateLegacyDraft,
  readDraft,
  removeDraft,
  writeDraft,
  type CVDraft,
} from '../cvDraft';

const memoryStorage = (initial: Record<string, string> = {}) => {
  const map = new Map(Object.entries(initial));
  return {
    getItem: (k: string) => (map.has(k) ? (map.get(k) as string) : null),
    setItem: (k: string, v: string) => void map.set(k, v),
    removeItem: (k: string) => void map.delete(k),
    keys: () => [...map.keys()].sort(),
  };
};

const draft = (overrides: Partial<CVDraft> = {}): CVDraft => ({
  data: initialCVData,
  themeId: 'modern',
  title: 'My CV',
  mode: 'form',
  markdown: '',
  dirty: true,
  updatedAt: 1,
  ...overrides,
});

const resolveTheme = (id: string | null, css: string | null) =>
  css === 'HARVARD_CSS' ? 'hardvard' : id || 'hardvard';

describe('cvDraft storage', () => {
  it('keeps one draft per CV plus one for unsaved work', () => {
    const storage = memoryStorage();
    writeDraft('abc', draft({ title: 'A' }), storage);
    writeDraft(null, draft({ title: 'New' }), storage);

    expect(storage.keys()).toEqual(['cv-draft:abc', 'cv-draft:new']);
    expect(readDraft('abc', storage)?.title).toBe('A');
    expect(readDraft(null, storage)?.title).toBe('New');
    expect(readDraft('other', storage)).toBeNull();

    removeDraft('abc', storage);
    expect(readDraft('abc', storage)).toBeNull();
  });

  it('ignores corrupt entries', () => {
    const storage = memoryStorage({
      [draftKey('x')]: '{not json',
      [draftKey('y')]: '{"title":"t"}',
    });
    expect(readDraft('x', storage)).toBeNull();
    expect(readDraft('y', storage)).toBeNull();
  });
});

describe('legacy draft migration', () => {
  it('moves a saved CV to its id and lets the server copy win', () => {
    const storage = memoryStorage({
      'cv-data': JSON.stringify(initialCVData),
      'cv-resume-id': JSON.stringify('abc-123'),
      'cv-theme-id': JSON.stringify('basic'),
      'cv-custom-css': JSON.stringify('HARVARD_CSS'),
      'app-lang': JSON.stringify('en'),
    });

    migrateLegacyDraft(resolveTheme, storage);

    expect(storage.keys()).toEqual(['app-lang', 'cv-draft:abc-123']);
    const migrated = readDraft('abc-123', storage);
    expect(migrated?.data).toEqual(initialCVData);
    // The old default paired id "basic" with the Harvard stylesheet; keep what the user saw
    expect(migrated?.themeId).toBe('hardvard');
    expect(migrated?.dirty).toBe(false);
  });

  it('keeps an unsaved guest draft as dirty', () => {
    const storage = memoryStorage({
      'cv-data': JSON.stringify(initialCVData),
      'cv-resume-id': 'null',
      'cv-theme-id': JSON.stringify('minimal'),
    });

    migrateLegacyDraft(resolveTheme, storage);

    expect(storage.keys()).toEqual(['cv-draft:new']);
    expect(readDraft(null, storage)?.dirty).toBe(true);
    expect(readDraft(null, storage)?.themeId).toBe('minimal');
  });

  it('does nothing when there is no legacy data, and never overwrites a new draft', () => {
    const empty = memoryStorage({ 'cv-theme-id': JSON.stringify('basic') });
    migrateLegacyDraft(resolveTheme, empty);
    expect(empty.keys()).toEqual(['cv-theme-id']);

    const existing = memoryStorage({ 'cv-data': JSON.stringify(initialCVData) });
    writeDraft(null, draft({ title: 'Keep me' }), existing);
    migrateLegacyDraft(resolveTheme, existing);
    expect(readDraft(null, existing)?.title).toBe('Keep me');
    expect(existing.keys()).toEqual(['cv-draft:new']);
  });
});
