import { describe, expect, it } from 'vitest';
import {
  isLinkKey,
  keyFromAddress,
  publicRef,
  publicUrl,
  slugProblem,
  suggestSlug,
} from '../publicLinks';

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

  it('are the key, then the name', () => {
    expect(publicRef(link)).toBe('k7f2m9qx/juan-perez');
    expect(publicUrl(link, 'https://www.cvstudio.tools')).toBe(
      'https://www.cvstudio.tools/u/k7f2m9qx/juan-perez'
    );
  });

  it.each([
    ['k7f2m9qx', 'k7f2m9qx'],
    ['K7F2M9QX', 'k7f2m9qx'],
    [' k7f2m9qx ', 'k7f2m9qx'],
    // The earlier shape, <name>-<key>, is still understood
    ['juan-perez-k7f2m9qx', 'k7f2m9qx'],
    ['a-b-c-abcd2345', 'abcd2345'],
  ])('the key of %j is %s', (segment, key) => {
    expect(keyFromAddress(segment)).toBe(key);
    expect(isLinkKey(key)).toBe(true);
  });

  it.each(['juan-perez', 'short', 'toolongkey9', 'k7f2_9qx', '', '-', 'juan-perez-short'])(
    '%j has no valid key',
    (segment) => {
      expect(keyFromAddress(segment)).toBeNull();
    }
  );
});
