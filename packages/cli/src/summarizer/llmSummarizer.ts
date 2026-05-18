import Anthropic from '@anthropic-ai/sdk';
import OpenAI from 'openai';
import * as fs from 'fs';
import * as path from 'path';
import { z } from 'zod';
import type { CodeContextConfig, FileContext } from '@codecontext/core';
import { sha256Hex } from '../utils/hash';

const PROMPT_VERSION = '3';
export const PARSER_VERSION = '1';

const LlmSummarySchema = z.object({
  purpose: z.string(),
  summary: z.string(),
  risks: z.array(z.string()).optional(),
  entrypoints: z.array(z.string()).optional(),
  tags: z.array(z.string()).optional(),
  relatedConcerns: z.array(z.string()).optional(),
});

/** Ollama prompt asks for a slightly different JSON shape. */
const OllamaJsonSchema = z.object({
  purpose: z.string(),
  summary: z.string(),
  exports: z.array(z.string()).optional(),
  functions: z.array(z.string()).optional(),
});

export interface SummarizeOptions {
  config: CodeContextConfig;
  projectRoot: string;
  dryRun?: boolean;
  skipLlm?: boolean;
  yes?: boolean;
  anthropicApiKey?: string;
  openaiApiKey?: string;
  maxFiles?: number;
  /** Log Ollama request/response details to stderr. */
  debugLlm?: boolean;
  /** Called after each file is summarized (done is 1-based count finished). */
  onProgress?: (done: number, total: number, filePath: string) => void;
}

interface CacheEntry {
  summary: string;
  purpose: string;
  tags?: string[];
  risks?: string[];
  entrypoints?: string[];
  relatedConcerns?: string[];
  llmDiagnostics?: string[];
}

interface CacheFile {
  entries: Record<string, CacheEntry>;
}

export function mergeDiagnostics(fc: FileContext, ...tags: string[]): FileContext {
  const base = [...(fc.diagnostics ?? [])];
  for (const x of tags) {
    if (x && !base.includes(x)) base.push(x);
  }
  return { ...fc, diagnostics: base };
}

function loadCache(projectRoot: string): CacheFile {
  const p = path.join(projectRoot, '.ai-context', 'cache', 'summaries.json');
  try {
    return JSON.parse(fs.readFileSync(p, 'utf-8')) as CacheFile;
  } catch {
    return { entries: {} };
  }
}

function saveCache(projectRoot: string, cache: CacheFile): void {
  const dir = path.join(projectRoot, '.ai-context', 'cache');
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(
    path.join(dir, 'summaries.json'),
    JSON.stringify(cache, null, 2)
  );
}

export function clearSummaryCache(projectRoot: string): void {
  const p = path.join(projectRoot, '.ai-context', 'cache', 'summaries.json');
  try {
    fs.unlinkSync(p);
  } catch {
    /* ignore */
  }
}

function cacheKey(fc: FileContext, model: string, provider: string): string {
  const basis = `${fc.contentHash ?? ''}:${PARSER_VERSION}:${PROMPT_VERSION}:${provider}:${model}:${fc.filePath}`;
  return sha256Hex(basis);
}

/** GET base URL to see if Ollama is listening. */
export async function checkOllamaReachable(baseUrl: string): Promise<boolean> {
  const u = baseUrl.replace(/\/$/, '');
  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 4000);
    const res = await fetch(u, { method: 'GET', signal: ctrl.signal });
    clearTimeout(t);
    return res.ok;
  } catch {
    return false;
  }
}

async function callAnthropic(
  apiKey: string,
  model: string,
  temperature: number,
  userContent: string
): Promise<string> {
  const client = new Anthropic({ apiKey });
  const msg = await client.messages.create({
    model,
    max_tokens: 2048,
    temperature,
    system:
      'You are a senior engineer. Reply with ONLY valid JSON matching the schema. No markdown fences.',
    messages: [{ role: 'user', content: userContent }],
  });
  const block = msg.content[0];
  if (block.type !== 'text') throw new Error('Unexpected Anthropic response');
  return block.text;
}

async function callOpenAI(
  apiKey: string,
  model: string,
  temperature: number,
  userContent: string
): Promise<string> {
  const client = new OpenAI({ apiKey });
  const res = await client.chat.completions.create({
    model,
    temperature,
    messages: [
      {
        role: 'system',
        content:
          'You are a senior engineer. Reply with ONLY valid JSON. No markdown.',
      },
      { role: 'user', content: userContent },
    ],
  });
  const text = res.choices[0]?.message?.content;
  if (!text) throw new Error('Empty OpenAI response');
  return text;
}

export function extractOllamaResponseText(
  data: Record<string, unknown>
): string {
  const r = data.response;
  if (typeof r === 'string' && r.trim().length > 0) {
    return r;
  }
  if (r && typeof r === 'object') {
    return JSON.stringify(r);
  }
  if (typeof data.message === 'string' && data.message.trim().length > 0) {
    return data.message;
  }
  const skip = new Set([
    'model',
    'created_at',
    'done',
    'total_duration',
    'load_duration',
    'prompt_eval_count',
    'eval_count',
    'response',
  ]);
  const rest: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(data)) {
    if (!skip.has(k)) rest[k] = v;
  }
  if (Object.keys(rest).length > 0) {
    return JSON.stringify(rest);
  }
  throw new Error('Ollama: empty or unrecognized response shape');
}

async function callOllama(
  baseUrl: string,
  model: string,
  prompt: string,
  temperature: number,
  debug: boolean
): Promise<string> {
  const url = `${baseUrl.replace(/\/$/, '')}/api/generate`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model,
      prompt,
      stream: false,
      format: 'json',
      options: { temperature },
    }),
  });
  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Ollama HTTP ${res.status}: ${errText.slice(0, 200)}`);
  }
  const data = (await res.json()) as Record<string, unknown>;
  if (debug) {
    // eslint-disable-next-line no-console
    console.error(
      '[LLM-DEBUG] ollama raw JSON (first 800 chars):',
      JSON.stringify(data).slice(0, 800)
    );
  }
  const text = extractOllamaResponseText(data);
  if (debug) {
    // eslint-disable-next-line no-console
    console.error(
      '[LLM-DEBUG] ollama extracted response text (first 400 chars):',
      text.slice(0, 400)
    );
  }
  return text;
}

function buildUserPayload(fc: FileContext, contentSnippet: string): string {
  return JSON.stringify(
    {
      filePath: fc.filePath,
      language: fc.language,
      exports: fc.exports.slice(0, 80),
      imports: fc.imports.slice(0, 80),
      functions: fc.functions.slice(0, 80),
      dbAccess: fc.dbAccess,
      apiUsage: fc.apiUsage,
      snippet: contentSnippet.slice(0, 24000),
    },
    null,
    2
  );
}

function buildOllamaPrompt(fc: FileContext, codeExcerpt: string): string {
  const excerpt =
    codeExcerpt.length > 28000 ? codeExcerpt.slice(0, 28000) : codeExcerpt;
  return `You are a code analysis tool. Analyze this code file and respond with ONLY a JSON object, no explanation.

File: ${fc.filePath}
Language: ${fc.language}
Code excerpt:
${excerpt}

Respond with this exact JSON structure:
{
  "purpose": "one sentence describing what this file does",
  "summary": "2-3 sentence description for an AI coding agent",
  "exports": ["list", "of", "exported", "names"],
  "functions": ["list", "of", "function", "names"]
}`;
}

/** Strip markdown fences and trim; then JSON.parse. */
export function stripJsonFences(text: string): string {
  let t = text.trim();
  const wrapped = /```(?:json)?\s*([\s\S]*?)```/i.exec(t);
  if (wrapped) {
    t = wrapped[1].trim();
  } else {
    t = t.replace(/^```json\s*/i, '').replace(/```\s*$/i, '');
  }
  return t.trim();
}

function parseJsonLoose(text: string): unknown {
  const trimmed = stripJsonFences(text);
  return JSON.parse(trimmed);
}

function tryParseOllamaJson(
  raw: string,
  debug: boolean
): { ok: true; parsed: z.infer<typeof OllamaJsonSchema> } | { ok: false } {
  try {
    let parsed: unknown;
    try {
      parsed = parseJsonLoose(raw);
    } catch {
      parsed = JSON.parse(stripJsonFences(raw));
    }
    const out = OllamaJsonSchema.parse(parsed);
    if (debug) {
      // eslint-disable-next-line no-console
      console.error(
        '[LLM-DEBUG] parsed Ollama JSON:',
        JSON.stringify(out).slice(0, 500)
      );
    }
    return { ok: true, parsed: out };
  } catch (err) {
    if (debug) {
      // eslint-disable-next-line no-console
      console.error('[LLM-DEBUG] Ollama JSON parse error:', err);
    }
    return { ok: false };
  }
}

export async function summarizeFileContext(
  fc: FileContext,
  content: string,
  opts: SummarizeOptions
): Promise<FileContext> {
  const debug = opts.debugLlm === true;

  if (opts.skipLlm || opts.dryRun) {
    if (debug) {
      // eslint-disable-next-line no-console
      console.error('[LLM-DEBUG] summarizeFileContext skipped:', fc.filePath);
    }
    return mergeDiagnostics(fc, 'ollama:skipped');
  }

  const cfg = opts.config.llm!;
  const provider = cfg.provider ?? 'ollama';

  if (debug) {
    // eslint-disable-next-line no-console
    console.error('[LLM-DEBUG] summarizeFileContext:', fc.filePath);
    // eslint-disable-next-line no-console
    console.error('[LLM-DEBUG] provider:', provider);
    // eslint-disable-next-line no-console
    console.error('[LLM-DEBUG] skipLlm:', opts.skipLlm);
  }

  if (provider === 'ollama') {
    const baseUrl = cfg.ollamaUrl ?? 'http://localhost:11434';
    const model = cfg.model;
    const snippet = content.length > 28000 ? content.slice(0, 28000) : content;
    const prompt = buildOllamaPrompt(fc, snippet);
    const skipOnError = cfg.skipOnError !== false;

    try {
      const rawText = await callOllama(
        baseUrl,
        model,
        prompt,
        cfg.temperature ?? 0.2,
        debug
      );
      if (!rawText || !rawText.trim()) {
        const next = mergeDiagnostics(fc, 'ollama:empty-response');
        if (skipOnError) return next;
        throw new Error('Ollama returned empty response text');
      }
      const pr = tryParseOllamaJson(rawText, debug);
      if (!pr.ok) {
        const next = mergeDiagnostics(fc, 'ollama:parse-error');
        if (skipOnError) return next;
        throw new Error('Ollama JSON parse failed');
      }
      const parsed = pr.parsed;
      return mergeDiagnostics(
        {
          ...fc,
          purpose: parsed.purpose || fc.purpose,
          summary: parsed.summary || fc.summary,
          tags: fc.tags,
          risks: fc.risks,
          entrypoints: fc.entrypoints,
          relatedConcerns: fc.relatedConcerns,
        },
        'ollama:success'
      );
    } catch (e) {
      if (debug) {
        // eslint-disable-next-line no-console
        console.error('[LLM-DEBUG] Ollama ERROR:', e);
      }
      const msg = e instanceof Error ? e.message : String(e);
      const tag = msg.includes('empty') ? 'ollama:empty-response' : 'ollama:parse-error';
      const next = mergeDiagnostics(fc, tag);
      if (skipOnError) return next;
      throw e;
    }
  }

  const apiKey =
    opts.anthropicApiKey ||
    opts.openaiApiKey ||
    (provider === 'anthropic'
      ? process.env.ANTHROPIC_API_KEY
      : process.env.OPENAI_API_KEY);

  if (!apiKey) {
    return mergeDiagnostics(
      {
        ...fc,
        summary:
          fc.summary +
          ' (LLM skipped: set ANTHROPIC_API_KEY or OPENAI_API_KEY)',
      },
      'ollama:skipped'
    );
  }

  const snippet = content.length > 28000 ? content.slice(0, 28000) : content;
  const user = `Return JSON with keys: purpose, summary, risks?, entrypoints?, tags?, relatedConcerns?\n${buildUserPayload(fc, snippet)}`;

  let raw: string;
  if (provider === 'anthropic') {
    raw = await callAnthropic(
      apiKey,
      cfg.model,
      cfg.temperature ?? 0.2,
      user
    );
  } else {
    raw = await callOpenAI(apiKey, cfg.model, cfg.temperature ?? 0.2, user);
  }

  let parsed: z.infer<typeof LlmSummarySchema>;
  try {
    parsed = LlmSummarySchema.parse(parseJsonLoose(raw));
  } catch {
    const retry = `${user}\n\nYour previous reply was invalid JSON. Fix and reply JSON only.`;
    const raw2 =
      provider === 'anthropic'
        ? await callAnthropic(
            apiKey,
            cfg.model,
            cfg.temperature ?? 0.2,
            retry
          )
        : await callOpenAI(apiKey, cfg.model, cfg.temperature ?? 0.2, retry);
    parsed = LlmSummarySchema.parse(parseJsonLoose(raw2));
  }

  return mergeDiagnostics(
    {
      ...fc,
      purpose: parsed.purpose || fc.purpose,
      summary: parsed.summary,
      risks: parsed.risks,
      entrypoints: parsed.entrypoints,
      relatedConcerns: parsed.relatedConcerns,
      tags: parsed.tags,
    },
    'cloud:success'
  );
}

async function mapWithConcurrency(
  n: number,
  limit: number,
  worker: (index: number) => Promise<void>
): Promise<void> {
  let next = 0;
  const run = async (): Promise<void> => {
    while (true) {
      const i = next++;
      if (i >= n) return;
      await worker(i);
    }
  };
  const workers = Math.min(Math.max(1, limit), n);
  await Promise.all(Array.from({ length: workers }, () => run()));
}

/** Rough USD estimate (order-of-magnitude; update with current pricing). */
export function estimateCostUsd(
  fileCount: number,
  avgCharsPerFile = 4000
): {
  low: number;
  high: number;
  approxTokens: number;
} {
  const approxTokens = Math.ceil((fileCount * avgCharsPerFile) / 4);
  const inPerM = 3;
  const outPerM = 15;
  const outTokens = fileCount * 220;
  const low = (approxTokens / 1e6) * inPerM + (outTokens / 1e6) * outPerM;
  const high = low * 2.5;
  return { low, high, approxTokens };
}

function shouldCacheSummary(fc: FileContext): boolean {
  const d = fc.diagnostics ?? [];
  return d.includes('ollama:success') || d.includes('cloud:success');
}

export async function summarizeFiles(
  contexts: FileContext[],
  readContent: (rel: string) => string,
  opts: SummarizeOptions
): Promise<FileContext[]> {
  if (opts.skipLlm || opts.dryRun) {
    return contexts.map((fc) => mergeDiagnostics(fc, 'ollama:skipped'));
  }

  const cfg = opts.config.llm!;
  const model = cfg.model;
  const provider = cfg.provider ?? 'ollama';
  const cache = loadCache(opts.projectRoot);
  const total = contexts.length;
  const out: FileContext[] = new Array(total);
  let finished = 0;

  const concurrency = Math.max(1, cfg.maxConcurrency ?? 2);

  async function processOne(i: number): Promise<void> {
    const fc = contexts[i];
    const key = cacheKey(fc, model, provider);
    const hit = cache.entries[key];
    if (hit) {
      out[i] = mergeDiagnostics(
        {
          ...fc,
          purpose: hit.purpose || fc.purpose,
          summary: hit.summary,
          tags: hit.tags,
          risks: hit.risks,
          entrypoints: hit.entrypoints,
          relatedConcerns: hit.relatedConcerns,
        },
        ...(hit.llmDiagnostics ?? [])
      );
      finished += 1;
      opts.onProgress?.(finished, total, fc.filePath);
      return;
    }

    let content = '';
    try {
      content = readContent(fc.filePath);
    } catch {
      content = '';
    }

    const next = await summarizeFileContext(fc, content, opts);
    if (shouldCacheSummary(next)) {
      const llmDiag = (next.diagnostics ?? []).filter(
        (x) => x === 'ollama:success' || x === 'cloud:success'
      );
      cache.entries[key] = {
        summary: next.summary,
        purpose: next.purpose,
        tags: next.tags,
        risks: next.risks,
        entrypoints: next.entrypoints,
        relatedConcerns: next.relatedConcerns,
        llmDiagnostics: llmDiag.length ? llmDiag : ['ollama:success'],
      };
      saveCache(opts.projectRoot, cache);
    }

    out[i] = next;
    finished += 1;
    opts.onProgress?.(finished, total, fc.filePath);
  }

  await mapWithConcurrency(total, concurrency, processOne);

  return out;
}

export async function testOllamaOnFirstFile(
  projectRoot: string,
  config: CodeContextConfig
): Promise<void> {
  const { scanFiles } = await import('../parser/fileScanner');
  const { parseFilesAST } = await import('../parser/astParser');
  const files = await scanFiles(projectRoot, {});
  if (files.length === 0) {
    // eslint-disable-next-line no-console
    console.error('No source files found.');
    return;
  }
  const first = files[0];
  const [fc] = await parseFilesAST([first], projectRoot);
  const content = fs.readFileSync(first, 'utf-8');
  // eslint-disable-next-line no-console
  console.error('Testing Ollama on:', fc.filePath);
  const out = await summarizeFileContext(fc, content, {
    config,
    projectRoot,
    skipLlm: false,
    debugLlm: true,
  });
  // eslint-disable-next-line no-console
  console.error('Final diagnostics:', out.diagnostics);
  // eslint-disable-next-line no-console
  console.error('Final purpose:', out.purpose);
  // eslint-disable-next-line no-console
  console.error('Final summary:', out.summary);
}
