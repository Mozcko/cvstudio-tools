import { describe, expect, it } from 'vitest';
import { parsePublicRef, publicRef, publicUrl, slugProblem, suggestSlug } from '../publicLinks';

describe('slugProblem', () => {
  it.each(['abc', 'juan-perez', 'ana-2', 'a'.repeat(40), '  Juan-Perez  ', 'admin', 'pricing'])(
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
    ['x'.repeat(60), 'x'.repeat(40)],
    [`${'ab'.repeat(19)}a b`, `${'ab'.repeat(19)}a`],
  ])('%j → %s', (name, slug) => {
    expect(suggestSlug(name)).toBe(slug);
    expect(slugProblem(suggestSlug(name))).toBeNull();
  });
});

describe('addresses', () => {
  const link = { slug: 'juan-perez', key: 'k7f2m9qx' };

  it('are the name followed by the key', () => {
    expect(publicRef(link)).toBe('juan-perez-k7f2m9qx');
    expect(publicUrl(link, 'https://www.cvstudio.tools')).toBe(
      'https://www.cvstudio.tools/u/juan-perez-k7f2m9qx'
    );
  });

  it.each([
    ['juan-perez-k7f2m9qx', { name: 'juan-perez', key: 'k7f2m9qx' }],
    ['JUAN-PEREZ-K7F2M9QX', { name: 'juan-perez', key: 'k7f2m9qx' }],
    ['k7f2m9qx', { name: '', key: 'k7f2m9qx' }],
    ['a-b-c-abcd2345', { name: 'a-b-c', key: 'abcd2345' }],
    // Round trip
    [publicRef(link), { name: link.slug, key: link.key }],
  ])('%j is understood', (ref, expected) => {
    expect(parsePublicRef(ref)).toEqual(expected);
  });

  it.each([
    'juan-perez',
    'juan-perez-short',
    'juan-perez-toolongkey9',
    'juan-k7f2_9qx',
    '',
    '-',
    'a/b-k7f2m9qx/',
  ])('%j has no valid key', (ref) => {
    expect(parsePublicRef(ref)).toBeNull();
  });
});
