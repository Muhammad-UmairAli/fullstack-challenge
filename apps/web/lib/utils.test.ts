import { describe, expect, it } from '@jest/globals';
import { safeRedirectPath } from './utils';

describe('safeRedirectPath', () => {
  it.each(['/', '/projects/1', '/projects?tab=a#top'])(
    'keeps same-site path %s',
    (path) => {
      expect(safeRedirectPath(path)).toBe(path);
    },
  );

  it.each([
    null,
    undefined,
    '',
    'projects',
    'https://evil.example',
    '//evil.example',
    '/\\evil.example',
    '/\t/evil.example',
    'javascript:alert(1)',
  ])('falls back for unsafe target %p', (target) => {
    expect(safeRedirectPath(target)).toBe('/');
  });
});
