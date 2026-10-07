import { describe, expect, it } from 'vitest';
import { isPublicPath } from '../routes';

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
    '/en/privacy',
    '/fr',
    '/fr/pricing',
    '/sign-insider',
    '/api/anything',
    '/admin',
  ])('%s requires sign-in', (path) => {
    expect(isPublicPath(path)).toBe(false);
  });
});
