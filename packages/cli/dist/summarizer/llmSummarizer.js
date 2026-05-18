"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PARSER_VERSION = void 0;
exports.mergeDiagnostics = mergeDiagnostics;
exports.clearSummaryCache = clearSummaryCache;
exports.checkOllamaReachable = checkOllamaReachable;
exports.extractOllamaResponseText = extractOllamaResponseText;
exports.stripJsonFences = stripJsonFences;
exports.summarizeFileContext = summarizeFileContext;
exports.estimateCostUsd = estimateCostUsd;
exports.summarizeFiles = summarizeFiles;
exports.testOllamaOnFirstFile = testOllamaOnFirstFile;
const sdk_1 = __importDefault(require("@anthropic-ai/sdk"));
const openai_1 = __importDefault(require("openai"));
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const zod_1 = require("zod");
const hash_1 = require("../utils/hash");
const PROMPT_VERSION = '3';
exports.PARSER_VERSION = '1';
const LlmSummarySchema = zod_1.z.object({
    purpose: zod_1.z.string(),
    summary: zod_1.z.string(),
    risks: zod_1.z.array(zod_1.z.string()).optional(),
    entrypoints: zod_1.z.array(zod_1.z.string()).optional(),
    tags: zod_1.z.array(zod_1.z.string()).optional(),
    relatedConcerns: zod_1.z.array(zod_1.z.string()).optional(),
});
/** Ollama prompt asks for a slightly different JSON shape. */
const OllamaJsonSchema = zod_1.z.object({
    purpose: zod_1.z.string(),
    summary: zod_1.z.string(),
    exports: zod_1.z.array(zod_1.z.string()).optional(),
    functions: zod_1.z.array(zod_1.z.string()).optional(),
});
function mergeDiagnostics(fc, ...tags) {
    const base = [...(fc.diagnostics ?? [])];
    for (const x of tags) {
        if (x && !base.includes(x))
            base.push(x);
    }
    return { ...fc, diagnostics: base };
}
function loadCache(projectRoot) {
    const p = path.join(projectRoot, '.ai-context', 'cache', 'summaries.json');
    try {
        return JSON.parse(fs.readFileSync(p, 'utf-8'));
    }
    catch {
        return { entries: {} };
    }
}
function saveCache(projectRoot, cache) {
    const dir = path.join(projectRoot, '.ai-context', 'cache');
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(path.join(dir, 'summaries.json'), JSON.stringify(cache, null, 2));
}
function clearSummaryCache(projectRoot) {
    const p = path.join(projectRoot, '.ai-context', 'cache', 'summaries.json');
    try {
        fs.unlinkSync(p);
    }
    catch {
        /* ignore */
    }
}
function cacheKey(fc, model, provider) {
    const basis = `${fc.contentHash ?? ''}:${exports.PARSER_VERSION}:${PROMPT_VERSION}:${provider}:${model}:${fc.filePath}`;
    return (0, hash_1.sha256Hex)(basis);
}
/** GET base URL to see if Ollama is listening. */
async function checkOllamaReachable(baseUrl) {
    const u = baseUrl.replace(/\/$/, '');
    try {
        const ctrl = new AbortController();
        const t = setTimeout(() => ctrl.abort(), 4000);
        const res = await fetch(u, { method: 'GET', signal: ctrl.signal });
        clearTimeout(t);
        return res.ok;
    }
    catch {
        return false;
    }
}
async function callAnthropic(apiKey, model, temperature, userContent) {
    const client = new sdk_1.default({ apiKey });
    const msg = await client.messages.create({
        model,
        max_tokens: 2048,
        temperature,
        system: 'You are a senior engineer. Reply with ONLY valid JSON matching the schema. No markdown fences.',
        messages: [{ role: 'user', content: userContent }],
    });
    const block = msg.content[0];
    if (block.type !== 'text')
        throw new Error('Unexpected Anthropic response');
    return block.text;
}
async function callOpenAI(apiKey, model, temperature, userContent) {
    const client = new openai_1.default({ apiKey });
    const res = await client.chat.completions.create({
        model,
        temperature,
        messages: [
            {
                role: 'system',
                content: 'You are a senior engineer. Reply with ONLY valid JSON. No markdown.',
            },
            { role: 'user', content: userContent },
        ],
    });
    const text = res.choices[0]?.message?.content;
    if (!text)
        throw new Error('Empty OpenAI response');
    return text;
}
function extractOllamaResponseText(data) {
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
    const rest = {};
    for (const [k, v] of Object.entries(data)) {
        if (!skip.has(k))
            rest[k] = v;
    }
    if (Object.keys(rest).length > 0) {
        return JSON.stringify(rest);
    }
    throw new Error('Ollama: empty or unrecognized response shape');
}
async function callOllama(baseUrl, model, prompt, temperature, debug) {
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
    const data = (await res.json());
    if (debug) {
        // eslint-disable-next-line no-console
        console.error('[LLM-DEBUG] ollama raw JSON (first 800 chars):', JSON.stringify(data).slice(0, 800));
    }
    const text = extractOllamaResponseText(data);
    if (debug) {
        // eslint-disable-next-line no-console
        console.error('[LLM-DEBUG] ollama extracted response text (first 400 chars):', text.slice(0, 400));
    }
    return text;
}
function buildUserPayload(fc, contentSnippet) {
    return JSON.stringify({
        filePath: fc.filePath,
        language: fc.language,
        exports: fc.exports.slice(0, 80),
        imports: fc.imports.slice(0, 80),
        functions: fc.functions.slice(0, 80),
        dbAccess: fc.dbAccess,
        apiUsage: fc.apiUsage,
        snippet: contentSnippet.slice(0, 24000),
    }, null, 2);
}
function buildOllamaPrompt(fc, codeExcerpt) {
    const excerpt = codeExcerpt.length > 28000 ? codeExcerpt.slice(0, 28000) : codeExcerpt;
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
function stripJsonFences(text) {
    let t = text.trim();
    const wrapped = /```(?:json)?\s*([\s\S]*?)```/i.exec(t);
    if (wrapped) {
        t = wrapped[1].trim();
    }
    else {
        t = t.replace(/^```json\s*/i, '').replace(/```\s*$/i, '');
    }
    return t.trim();
}
function parseJsonLoose(text) {
    const trimmed = stripJsonFences(text);
    return JSON.parse(trimmed);
}
function tryParseOllamaJson(raw, debug) {
    try {
        let parsed;
        try {
            parsed = parseJsonLoose(raw);
        }
        catch {
            parsed = JSON.parse(stripJsonFences(raw));
        }
        const out = OllamaJsonSchema.parse(parsed);
        if (debug) {
            // eslint-disable-next-line no-console
            console.error('[LLM-DEBUG] parsed Ollama JSON:', JSON.stringify(out).slice(0, 500));
        }
        return { ok: true, parsed: out };
    }
    catch (err) {
        if (debug) {
            // eslint-disable-next-line no-console
            console.error('[LLM-DEBUG] Ollama JSON parse error:', err);
        }
        return { ok: false };
    }
}
async function summarizeFileContext(fc, content, opts) {
    const debug = opts.debugLlm === true;
    if (opts.skipLlm || opts.dryRun) {
        if (debug) {
            // eslint-disable-next-line no-console
            console.error('[LLM-DEBUG] summarizeFileContext skipped:', fc.filePath);
        }
        return mergeDiagnostics(fc, 'ollama:skipped');
    }
    const cfg = opts.config.llm;
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
            const rawText = await callOllama(baseUrl, model, prompt, cfg.temperature ?? 0.2, debug);
            if (!rawText || !rawText.trim()) {
                const next = mergeDiagnostics(fc, 'ollama:empty-response');
                if (skipOnError)
                    return next;
                throw new Error('Ollama returned empty response text');
            }
            const pr = tryParseOllamaJson(rawText, debug);
            if (!pr.ok) {
                const next = mergeDiagnostics(fc, 'ollama:parse-error');
                if (skipOnError)
                    return next;
                throw new Error('Ollama JSON parse failed');
            }
            const parsed = pr.parsed;
            return mergeDiagnostics({
                ...fc,
                purpose: parsed.purpose || fc.purpose,
                summary: parsed.summary || fc.summary,
                tags: fc.tags,
                risks: fc.risks,
                entrypoints: fc.entrypoints,
                relatedConcerns: fc.relatedConcerns,
            }, 'ollama:success');
        }
        catch (e) {
            if (debug) {
                // eslint-disable-next-line no-console
                console.error('[LLM-DEBUG] Ollama ERROR:', e);
            }
            const msg = e instanceof Error ? e.message : String(e);
            const tag = msg.includes('empty') ? 'ollama:empty-response' : 'ollama:parse-error';
            const next = mergeDiagnostics(fc, tag);
            if (skipOnError)
                return next;
            throw e;
        }
    }
    const apiKey = opts.anthropicApiKey ||
        opts.openaiApiKey ||
        (provider === 'anthropic'
            ? process.env.ANTHROPIC_API_KEY
            : process.env.OPENAI_API_KEY);
    if (!apiKey) {
        return mergeDiagnostics({
            ...fc,
            summary: fc.summary +
                ' (LLM skipped: set ANTHROPIC_API_KEY or OPENAI_API_KEY)',
        }, 'ollama:skipped');
    }
    const snippet = content.length > 28000 ? content.slice(0, 28000) : content;
    const user = `Return JSON with keys: purpose, summary, risks?, entrypoints?, tags?, relatedConcerns?\n${buildUserPayload(fc, snippet)}`;
    let raw;
    if (provider === 'anthropic') {
        raw = await callAnthropic(apiKey, cfg.model, cfg.temperature ?? 0.2, user);
    }
    else {
        raw = await callOpenAI(apiKey, cfg.model, cfg.temperature ?? 0.2, user);
    }
    let parsed;
    try {
        parsed = LlmSummarySchema.parse(parseJsonLoose(raw));
    }
    catch {
        const retry = `${user}\n\nYour previous reply was invalid JSON. Fix and reply JSON only.`;
        const raw2 = provider === 'anthropic'
            ? await callAnthropic(apiKey, cfg.model, cfg.temperature ?? 0.2, retry)
            : await callOpenAI(apiKey, cfg.model, cfg.temperature ?? 0.2, retry);
        parsed = LlmSummarySchema.parse(parseJsonLoose(raw2));
    }
    return mergeDiagnostics({
        ...fc,
        purpose: parsed.purpose || fc.purpose,
        summary: parsed.summary,
        risks: parsed.risks,
        entrypoints: parsed.entrypoints,
        relatedConcerns: parsed.relatedConcerns,
        tags: parsed.tags,
    }, 'cloud:success');
}
async function mapWithConcurrency(n, limit, worker) {
    let next = 0;
    const run = async () => {
        while (true) {
            const i = next++;
            if (i >= n)
                return;
            await worker(i);
        }
    };
    const workers = Math.min(Math.max(1, limit), n);
    await Promise.all(Array.from({ length: workers }, () => run()));
}
/** Rough USD estimate (order-of-magnitude; update with current pricing). */
function estimateCostUsd(fileCount, avgCharsPerFile = 4000) {
    const approxTokens = Math.ceil((fileCount * avgCharsPerFile) / 4);
    const inPerM = 3;
    const outPerM = 15;
    const outTokens = fileCount * 220;
    const low = (approxTokens / 1e6) * inPerM + (outTokens / 1e6) * outPerM;
    const high = low * 2.5;
    return { low, high, approxTokens };
}
function shouldCacheSummary(fc) {
    const d = fc.diagnostics ?? [];
    return d.includes('ollama:success') || d.includes('cloud:success');
}
async function summarizeFiles(contexts, readContent, opts) {
    if (opts.skipLlm || opts.dryRun) {
        return contexts.map((fc) => mergeDiagnostics(fc, 'ollama:skipped'));
    }
    const cfg = opts.config.llm;
    const model = cfg.model;
    const provider = cfg.provider ?? 'ollama';
    const cache = loadCache(opts.projectRoot);
    const total = contexts.length;
    const out = new Array(total);
    let finished = 0;
    const concurrency = Math.max(1, cfg.maxConcurrency ?? 2);
    async function processOne(i) {
        const fc = contexts[i];
        const key = cacheKey(fc, model, provider);
        const hit = cache.entries[key];
        if (hit) {
            out[i] = mergeDiagnostics({
                ...fc,
                purpose: hit.purpose || fc.purpose,
                summary: hit.summary,
                tags: hit.tags,
                risks: hit.risks,
                entrypoints: hit.entrypoints,
                relatedConcerns: hit.relatedConcerns,
            }, ...(hit.llmDiagnostics ?? []));
            finished += 1;
            opts.onProgress?.(finished, total, fc.filePath);
            return;
        }
        let content = '';
        try {
            content = readContent(fc.filePath);
        }
        catch {
            content = '';
        }
        const next = await summarizeFileContext(fc, content, opts);
        if (shouldCacheSummary(next)) {
            const llmDiag = (next.diagnostics ?? []).filter((x) => x === 'ollama:success' || x === 'cloud:success');
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
async function testOllamaOnFirstFile(projectRoot, config) {
    const { scanFiles } = await Promise.resolve().then(() => __importStar(require('../parser/fileScanner')));
    const { parseFilesAST } = await Promise.resolve().then(() => __importStar(require('../parser/astParser')));
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
//# sourceMappingURL=llmSummarizer.js.map