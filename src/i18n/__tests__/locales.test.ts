import { describe, expect, it } from 'vitest';
import { locales } from '../locales';
import { privacy } from '../privacy';

/** Every key path in an object, e.g. `ui.nav.home` (arrays count as one leaf plus their length). */
const shape = (value: unknown, path = ''): string[] => {
  if (Array.isArray(value)) {
    return [`${path}[${value.length}]`, ...value.flatMap((v, i) => shape(v, `${path}.${i}`))];
  }
  if (value && typeof value === 'object') {
    return Object.entries(value).flatMap(([key, v]) => shape(v, path ? `${path}.${key}` : key));
  }
  return [path];
};

const leaves = (value: unknown): string[] =>
  typeof value === 'string'
    ? [value]
    : value && typeof value === 'object'
      ? Object.values(value).flatMap(leaves)
      : [];

describe.each([
  ['interface texts', locales],
  ['privacy policy', privacy],
])('%s', (_name, dictionary) => {
  const reference = shape(dictionary.es).sort();

  it.each(['en', 'pt'] as const)('%s has exactly the keys of es', (lang) => {
    expect(shape(dictionary[lang]).sort()).toEqual(reference);
  });

  it.each(['es', 'en', 'pt'] as const)('%s has no blank text besides known gaps', (lang) => {
    const blanks = shape(dictionary[lang]).filter((path) => {
      const value = path
        .split('.')
        .reduce<unknown>((node, key) => (node as Record<string, unknown>)?.[key], dictionary[lang]);
      return typeof value === 'string' && value.trim() === '';
    });
    // The comparison table has no watermark row text
    expect(blanks.filter((path) => path !== 'ui.pricing.table.rows.watermark')).toEqual([]);
  });
});

describe('translations', () => {
  it('English and Portuguese interface texts are not left in Spanish', () => {
    const spanishOnly = /\b(Currículum|Nombre|Guardar|Eliminar|Iniciar sesión|Añadir|Sección)\b/;
    for (const lang of ['en', 'pt'] as const) {
      expect(
        leaves(locales[lang]).filter((text) => spanishOnly.test(text)),
        lang
      ).toEqual([]);
    }
  });
});
