import { describe, it, expect, beforeAll } from 'vitest';
import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

const cliRoot = path.resolve(__dirname, '../..');
const repoRoot = path.resolve(cliRoot, '../..');
const cliEntry = path.join(cliRoot, 'dist/index.js');
const fixture = path.join(cliRoot, 'fixtures/minimal');

describe('codecontext generate (fixture)', () => {
  beforeAll(() => {
    execSync('npx tsc -p packages/core/tsconfig.json', {
      cwd: repoRoot,
      stdio: 'pipe',
    });
    execSync('npx tsc -p packages/cli/tsconfig.json', {
      cwd: repoRoot,
      stdio: 'pipe',
    });
  });

  it('writes .ai-context for minimal fixture', () => {
    const outDir = path.join(fixture, '.ai-context');
    if (fs.existsSync(outDir)) {
      fs.rmSync(outDir, { recursive: true, force: true });
    }
    execSync(`node "${cliEntry}" generate --skip-llm --dir "${fixture}"`, {
      stdio: 'pipe',
      env: process.env,
    });
    const indexPath = path.join(outDir, 'index.json');
    expect(fs.existsSync(indexPath)).toBe(true);
    const idx = JSON.parse(fs.readFileSync(indexPath, 'utf-8')) as {
      totalFiles: number;
      graph: { nodes: unknown[] };
    };
    expect(idx.totalFiles).toBeGreaterThan(0);
    expect(idx.graph.nodes.length).toBeGreaterThan(0);
  });
});
