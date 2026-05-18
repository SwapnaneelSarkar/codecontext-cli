import * as fs from 'fs';
import * as path from 'path';
import chalk from 'chalk';
import { scanFiles } from '../parser/fileScanner';
import { parseFilesAST } from '../parser/astParser';
import { mapDependencies } from '../parser/dependencyMapper';
import { buildDependencyGraph } from '../graph/graphBuilder';
import { writeContext } from '../writer/contextWriter';
import { loadProjectConfig } from '../config/loadConfig';
import {
  summarizeFiles,
  estimateCostUsd,
  checkOllamaReachable,
  clearSummaryCache,
  mergeDiagnostics,
} from '../summarizer/llmSummarizer';

export interface RunGenerateOptions {
  targetDir: string;
  skipLlm?: boolean;
  dryRun?: boolean;
  yes?: boolean;
  maxFiles?: number;
  concurrency?: number;
  anthropicApiKey?: string;
  openaiApiKey?: string;
  /** Delete `.ai-context/cache/summaries.json` before running (fresh LLM). */
  clearCache?: boolean;
  /** Print LLM pipeline debug lines to stderr. */
  debugLlm?: boolean;
  onProgress?: (
    phase: string,
    detail?: { done?: number; total?: number; file?: string }
  ) => void;
}

export async function runGenerate(opts: RunGenerateOptions): Promise<void> {
  const targetDir = path.resolve(opts.targetDir);
  const config = loadProjectConfig(targetDir);
  if (opts.concurrency && config.llm) {
    config.llm.maxConcurrency = opts.concurrency;
  }

  if (opts.clearCache) {
    clearSummaryCache(targetDir);
  }

  opts.onProgress?.('scan');
  const allFiles = await scanFiles(targetDir, {
    followSymlinks: config.scan?.followSymlinks,
  });
  let files = allFiles;
  if (opts.maxFiles && opts.maxFiles > 0) {
    files = files.slice(0, opts.maxFiles);
  }

  if (opts.dryRun) {
    const est = estimateCostUsd(files.length);
    // eslint-disable-next-line no-console
    console.log(
      `\nDry run: ~${est.approxTokens} tokens · est. $${est.low.toFixed(2)}–$${est.high.toFixed(2)} USD\n`
    );
    return;
  }

  opts.onProgress?.('parse');
  let fileContexts = await parseFilesAST(files, targetDir);

  opts.onProgress?.('deps');
  const depMap = mapDependencies(fileContexts, targetDir);

  opts.onProgress?.('graph');
  const projectGraph = await buildDependencyGraph(fileContexts, depMap);
  const warnings = projectGraph.circularDependencyWarnings ?? [];

  let skipLlmEffective = opts.skipLlm === true;
  const provider = config.llm?.provider ?? 'ollama';

  if (opts.debugLlm) {
    // eslint-disable-next-line no-console
    console.error('[LLM-DEBUG] skipLlmEffective:', skipLlmEffective);
    // eslint-disable-next-line no-console
    console.error('[LLM-DEBUG] provider:', config.llm?.provider);
  }

  if (!skipLlmEffective && provider === 'ollama') {
    const base = config.llm?.ollamaUrl ?? 'http://localhost:11434';
    const ok = await checkOllamaReachable(base);
    if (!ok) {
      // eslint-disable-next-line no-console
      console.error(
        chalk.red(
          '✗ Ollama is not running. Start it with: brew services start ollama\n' +
            '  Or run without LLM: codecontext generate --skip-llm'
        )
      );
      skipLlmEffective = true;
    }
  }

  if (skipLlmEffective && provider === 'ollama') {
    fileContexts = fileContexts.map((fc) =>
      mergeDiagnostics(fc, 'ollama:skipped')
    );
  }

  if (!skipLlmEffective) {
    const isPaidCloud =
      provider === 'anthropic' || provider === 'openai';
    if (isPaidCloud) {
      const est = estimateCostUsd(fileContexts.length);
      if (!opts.yes && process.stdin.isTTY) {
        // eslint-disable-next-line no-console
        console.log(
          `Estimated API cost (rough): $${est.low.toFixed(2)} – $${est.high.toFixed(2)} (~${est.approxTokens} tokens). Use --yes to skip this check.`
        );
      }
    } else if (provider === 'ollama' && process.stdin.isTTY) {
      // eslint-disable-next-line no-console
      console.log(
        chalk.gray('Using local Ollama (no API cost).\n')
      );
    }

    opts.onProgress?.('llm');
    const readContent = (rel: string) =>
      fs.readFileSync(path.join(targetDir, rel), 'utf-8');
    fileContexts = await summarizeFiles(fileContexts, readContent, {
      config,
      projectRoot: targetDir,
      skipLlm: false,
      dryRun: false,
      yes: opts.yes,
      anthropicApiKey: opts.anthropicApiKey,
      openaiApiKey: opts.openaiApiKey,
      debugLlm: opts.debugLlm,
      onProgress: (done, total, filePath) => {
        opts.onProgress?.('llm', { done, total, file: filePath });
      },
    });
  }

  opts.onProgress?.('write');
  await writeContext(fileContexts, projectGraph, targetDir, warnings);
}
