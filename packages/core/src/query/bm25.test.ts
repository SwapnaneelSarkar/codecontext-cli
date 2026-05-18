import { describe, it, expect } from 'vitest';
import { rankFilesByQuery } from './bm25';
import type { FileContext } from '../types/index';

describe('rankFilesByQuery', () => {
  it('prefers files matching query terms', () => {
    const files: FileContext[] = [
      {
        filePath: 'lib/auth.ts',
        language: 'TypeScript',
        purpose: 'Auth helpers',
        exports: ['login'],
        imports: ['bcrypt'],
        functions: ['login', 'logout'],
        dependencies: ['bcrypt'],
        dbAccess: [],
        apiUsage: ['express'],
        summary: 'User authentication and session handling',
      },
      {
        filePath: 'lib/utils.ts',
        language: 'TypeScript',
        purpose: 'Misc',
        exports: ['x'],
        imports: [],
        functions: ['x'],
        dependencies: [],
        dbAccess: [],
        apiUsage: [],
        summary: 'Random helpers',
      },
    ];
    const r = rankFilesByQuery('authentication session', files, 5);
    expect(r.length).toBeGreaterThan(0);
    expect(r[0].filePath).toContain('auth');
  });
});
