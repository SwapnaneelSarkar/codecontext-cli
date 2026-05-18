import type { FileContext, ImportRecord } from '@codecontext/core';
import * as fs from 'fs';
import * as path from 'path';
import { createMatchPath, loadConfig } from 'tsconfig-paths';

export interface ResolvedForFile {
  resolved: string[];
  externals: string[];
  importRecords: ImportRecord[];
}

export type DependencyMap = Map<string, ResolvedForFile>;

function probeFile(resolvedWithoutExt: string): string | null {
  const candidates = [
    resolvedWithoutExt,
    `${resolvedWithoutExt}.ts`,
    `${resolvedWithoutExt}.tsx`,
    `${resolvedWithoutExt}.js`,
    `${resolvedWithoutExt}.jsx`,
    `${resolvedWithoutExt}.mjs`,
    `${resolvedWithoutExt}.cjs`,
    path.join(resolvedWithoutExt, 'index.ts'),
    path.join(resolvedWithoutExt, 'index.tsx'),
    path.join(resolvedWithoutExt, 'index.js'),
  ];
  for (const c of candidates) {
    try {
      const st = fs.statSync(c);
      if (st.isFile()) return path.normalize(c);
    } catch {
      /* missing */
    }
  }
  return null;
}

function resolveRelative(fromAbsFile: string, spec: string, projectRoot: string): string | null {
  const dir = path.dirname(fromAbsFile);
  const joined = path.resolve(dir, spec);
  const hit = probeFile(joined);
  if (!hit) return null;
  const rel = path.relative(projectRoot, hit);
  if (rel.startsWith('..')) return null;
  return rel.split(path.sep).join('/');
}

function isBareOrPackage(spec: string): boolean {
  return !spec.startsWith('.') && !path.isAbsolute(spec);
}

/**
 * Build resolved dependency info per file (project-relative paths as keys).
 */
export function mapDependencies(
  fileContexts: FileContext[],
  projectRoot: string
): DependencyMap {
  const root = path.resolve(projectRoot);
  let matchPath: ReturnType<typeof createMatchPath> | undefined;
  try {
    const loaded = loadConfig(root);
    if (loaded.resultType === 'success') {
      matchPath = createMatchPath(loaded.absoluteBaseUrl, loaded.paths ?? {});
    }
  } catch {
    matchPath = undefined;
  }

  const normalizedPaths = new Set(
    fileContexts.map((f) => f.filePath.split(path.sep).join('/'))
  );

  const map: DependencyMap = new Map();

  for (const ctx of fileContexts) {
    const fromAbs = path.join(root, ctx.filePath);
    const records: ImportRecord[] = [];
    const resolved: string[] = [];
    const externals: string[] = [];

    const sourceRecords =
      ctx.importRecords && ctx.importRecords.length > 0
        ? ctx.importRecords
        : ctx.imports.map(
            (s): ImportRecord => ({
              specifier: s,
              resolvedPath: null,
              isDynamic: false,
            })
          );

    for (const rec of sourceRecords) {
      const spec = rec.specifier;

      if (isBareOrPackage(spec)) {
        let matchedRel: string | null = null;
        if (matchPath) {
          try {
            const tryMatch = matchPath(spec, undefined, undefined, [
              '.ts',
              '.tsx',
              '.js',
              '.jsx',
              '.json',
            ]);
            if (tryMatch) {
              const rel = path.relative(root, tryMatch).split(path.sep).join('/');
              if (!rel.startsWith('..')) {
                matchedRel = rel;
              }
            }
          } catch {
            /* ignore */
          }
        }
        if (matchedRel && normalizedPaths.has(matchedRel)) {
          resolved.push(matchedRel);
          records.push({
            specifier: spec,
            resolvedPath: matchedRel,
            isDynamic: rec.isDynamic,
          });
        } else {
          const pkg = spec.startsWith('@')
            ? spec.split('/').slice(0, 2).join('/')
            : spec.split('/')[0];
          if (pkg) externals.push(pkg);
          records.push({
            specifier: spec,
            resolvedPath: null,
            isDynamic: rec.isDynamic,
          });
        }
        continue;
      }

      const rel = resolveRelative(fromAbs, spec, root);
      if (rel && normalizedPaths.has(rel)) {
        resolved.push(rel);
        records.push({
          specifier: spec,
          resolvedPath: rel,
          isDynamic: rec.isDynamic,
        });
      } else {
        records.push({
          specifier: spec,
          resolvedPath: null,
          isDynamic: rec.isDynamic,
        });
      }
    }

    map.set(ctx.filePath.split(path.sep).join('/'), {
      resolved: [...new Set(resolved)],
      externals: [...new Set(externals)],
      importRecords: records,
    });
  }

  return map;
}
