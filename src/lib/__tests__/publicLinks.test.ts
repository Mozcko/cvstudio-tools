import { describe, expect, it } from 'vitest';
import { publicUrl, slugProblem, suggestSlug } from '../publicLinks';

describe('slugProblem', () => {
  it.each(['abc', 'juan-perez', 'ana-2', 'a'.repeat(40), '  Juan-Perez  '])(
    '%j is fine',
    (slug) => {
      expect(slugProblem(slug)).toBeNull();
    }
  );

  it.each([
    ['ab', 'length'],
    ['a'.repeat(41), 'length'],
    ['-abc', 'format'],
    ['abc-', 'format'],
    ['a--b', 'format'],
    ['juan perez', 'format'],
    ['josé', 'format'],
    ['a/b', 'format'],
    ['admin', 'reserved'],
    ['pricing', 'reserved'],
    ['APP', 'reserved'],
  ])('%j → %s', (slug, problem) => {
    expect(slugProblem(slug)).toBe(problem);
  });
});

describe('suggestSlug', () => {
  it.each([
    ['María José Pérez', 'maria-jose-perez'],
    ['  John   Doe  ', 'john-doe'],
    ["O'Brien, Seán", 'o-brien-sean'],
    ['João da Silva Jr.', 'joao-da-silva-jr'],
    ['A', 'mi-cv'],
    ['', 'mi-cv'],
    ['!!!', 'mi-cv'],
    ['Admin', 'mi-cv'],
    ['x'.repeat(60), 'x'.repeat(40)],
    [`${'ab'.repeat(19)}a b`, `${'ab'.repeat(19)}a`],
  ])('%j → %s', (name, slug) => {
    expect(suggestSlug(name)).toBe(slug);
    expect(slugProblem(suggestSlug(name))).toBeNull();
  });
});

describe('publicUrl', () => {
  it('builds the address of a link', () => {
    expect(publicUrl('juan-perez', 'https://www.cvstudio.tools')).toBe(
      'https://www.cvstudio.tools/u/juan-perez'
    );
  });
});
