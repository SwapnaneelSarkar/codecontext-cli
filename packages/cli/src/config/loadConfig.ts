import * as fs from 'fs';
import * as path from 'path';
import type { CodeContextConfig } from '@codecontext/core';
import { DEFAULT_CONFIG } from '@codecontext/core';

const CONFIG_NAMES = ['.codecontextrc.json', '.codecontextrc'];

export function loadProjectConfig(projectRoot: string): CodeContextConfig {
  let merged: CodeContextConfig = JSON.parse(JSON.stringify(DEFAULT_CONFIG)) as CodeContextConfig;
  for (const name of CONFIG_NAMES) {
    const p = path.join(projectRoot, name);
    if (fs.existsSync(p)) {
      try {
        const raw = fs.readFileSync(p, 'utf-8');
        const parsed = JSON.parse(raw) as Partial<CodeContextConfig>;
        merged = deepMerge(merged, parsed);
        break;
      } catch {
        // ignore invalid config
      }
    }
  }
  return merged;
}

function deepMerge(
  base: CodeContextConfig,
  patch: Partial<CodeContextConfig>
): CodeContextConfig {
  return {
    ...base,
    ...patch,
    include: patch.include ?? base.include,
    exclude: patch.exclude ?? base.exclude,
    llm: { ...base.llm!, ...(patch.llm ?? {}) },
    scan: { ...base.scan!, ...(patch.scan ?? {}) },
  };
}
