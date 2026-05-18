import { describe, it, expect } from 'vitest';
import { extractJsTsLike } from './regexExtract';

describe('extractJsTsLike', () => {
  it('extracts imports and exports', () => {
    const src = `
      import x from 'lodash';
      export function hello() {}
    `;
    const e = extractJsTsLike(src);
    expect(e.imports).toContain('lodash');
    expect(e.exports).toContain('hello');
  });
});
