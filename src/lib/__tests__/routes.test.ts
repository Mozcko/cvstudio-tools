import { describe, expect, it } from 'vitest';
import { isPublicPath, prefixedLocale, requiresSignIn } from '../routes';

describe('isPublicPath', () => {
  it.each([
    '/',
    '/en',
    '/en/',
    '/pt',
    '/pricing',
    '/en/pricing',
    '/pt/pricing/',
    '/sign-in',
    '/sign-in/sso-callback',
    '/en/sign-in/factor-one',
    '/sign-up',
    '/pt/sign-up/verify-email-address',
    '/app/editor',
    '/app/editor/',
    '/en/app/editor',
    '/privacy',
    '/privacy/',
    '/u/juan-perez-k7f2m9qx',
    '/u/juan-perez-k7f2m9qx/',
    '/en/privacy',
    '/pt/privacy/',
    '/login',
  ])('%s is public', (path) => {
    expect(isPublicPath(path)).toBe(true);
  });

  it.each([
    '/app/dashboard',
    '/en/app/dashboard',
    '/pt/app/dashboard/',
    '/app',
    '/app/editorial',
    '/app/editor-admin',
    '/pricing/secret',
    '/fr/privacy',
    '/u',
    '/u/juan/extra',
    '/en/u/juan-perez',
    '/en/login',
    '/fr',
    '/fr/pricing',
    '/sign-insider',
    '/api/anything',
    '/admin',
  ])('%s requires sign-in', (path) => {
    expect(isPublicPath(path)).toBe(false);
  });
});

describe('requiresSignIn', () => {
  it.each([
    '/app/dashboard',
    '/en/app/dashboard',
    '/pt/app/dashboard/',
    '/app',
    '/app/',
    '/app/editorial',
    '/app/editor-admin',
    '/app/settings/billing',
    // A mistyped locale must not open the app area
    '/fr/app/dashboard',
    '/xx/app',
  ])('%s sends signed-out visitors to sign in', (path) => {
    expect(requiresSignIn(path)).toBe(true);
  });

  it.each([
    '/',
    '/en/pricing',
    '/app/editor',
    '/pt/app/editor/',
    '/privacy',
    // Pages that do not exist are answered by the 404 page, not by a sign-in redirect
    '/does-not-exist',
    '/en/nope',
    '/fr',
    '/404',
    '/application',
    '/en/apple/pie',
  ])('%s does not', (path) => {
    expect(requiresSignIn(path)).toBe(false);
  });

  it('every path is public, private or unknown, never public and private', () => {
    for (const path of ['/', '/app/editor', '/app/dashboard', '/en/app/dashboard', '/nope']) {
      expect(isPublicPath(path) && requiresSignIn(path)).toBe(false);
    }
  });
});

describe('prefixedLocale', () => {
  it('accepts only the locales that have a URL prefix', () => {
    expect(prefixedLocale('en')).toBe('en');
    expect(prefixedLocale('pt')).toBe('pt');
    for (const lang of ['es', 'fr', 'EN', '', undefined]) expect(prefixedLocale(lang)).toBeNull();
  });
});
