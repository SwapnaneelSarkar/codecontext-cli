import * as fs from 'fs';
import * as path from 'path';
import {
  FileContext,
  ProjectGraph,
  ProjectIndex,
  SCHEMA_VERSION,
  type ContextManifest,
} from '@codecontext/core';
import { fileJsonSlug, sha256Hex } from '../utils/hash';
import { getCliVersion } from '../utils/cliVersion';
import { buildClaudeMemoryMd, buildContextMd } from './contextMarkdown';

function buildCursorRulesFragment(
  projectName: string,
  files: FileContext[]
): string {
  const topImports = new Map<string, number>();
  for (const f of files) {
    for (const i of f.imports) {
      const pkg = i.startsWith('.') ? 'relative' : i.split('/')[0];
      topImports.set(pkg, (topImports.get(pkg) ?? 0) + 1);
    }
  }
  const sorted = [...topImports.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 12)
    .map(([k]) => k);

  return [
    `# CodeContext — ${projectName}`,
    '',
    'Before editing, read `.ai-context/index.json` for the full project index and file summaries.',
    '',
    'Frequent import roots:',
    ...sorted.map((s) => `- ${s}`),
    '',
  ].join('\n');
}

/**
 * Write generated context to .ai-context/ folder
 */
export async function writeContext(
  fileContexts: FileContext[],
  projectGraph: ProjectGraph,
  baseDir: string,
  warnings: string[] = []
): Promise<void> {
  const contextDir = path.join(baseDir, '.ai-context');
  const filesDir = path.join(contextDir, 'files');
  const modulesDir = path.join(contextDir, 'modules');
  const cacheDir = path.join(contextDir, 'cache');

  fs.mkdirSync(filesDir, { recursive: true });
  fs.mkdirSync(modulesDir, { recursive: true });
  fs.mkdirSync(cacheDir, { recursive: true });

  const manifest: ContextManifest = {};

  for (const context of fileContexts) {
    const slug = fileJsonSlug(context.filePath);
    const filePath = path.join(filesDir, `${slug}.json`);
    fs.writeFileSync(filePath, JSON.stringify(context, null, 2));
    manifest[context.filePath] = {
      contentHash: context.contentHash ?? sha256Hex(context.summary),
      summaryHash: context.contentHash,
    };
  }

  const graphPath = path.join(contextDir, 'graph.json');
  fs.writeFileSync(graphPath, JSON.stringify(projectGraph, null, 2));

  const languages = Array.from(new Set(fileContexts.map((c) => c.language)));
  const modules = Array.from(
    new Set(fileContexts.flatMap((c) => c.dependencies))
  );

  const projectIndex: ProjectIndex = {
    schemaVersion: SCHEMA_VERSION,
    cliVersion: getCliVersion(),
    projectName: path.basename(baseDir),
    generatedAt: projectGraph.generatedAt,
    totalFiles: fileContexts.length,
    languages,
    modules,
    files: fileContexts,
    graph: projectGraph,
    warnings,
  };

  const indexPath = path.join(contextDir, 'index.json');
  fs.writeFileSync(indexPath, JSON.stringify(projectIndex, null, 2));

  const manifestPath = path.join(contextDir, 'manifest.json');
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));

  fs.writeFileSync(
    path.join(contextDir, 'CONTEXT.md'),
    buildContextMd(projectIndex.projectName, fileContexts, projectGraph)
  );
  fs.writeFileSync(
    path.join(contextDir, '.cursorrules.fragment'),
    buildCursorRulesFragment(projectIndex.projectName, fileContexts)
  );
  fs.writeFileSync(
    path.join(contextDir, 'CLAUDE.md'),
    buildClaudeMemoryMd(projectIndex.projectName, fileContexts, projectGraph)
  );
}
