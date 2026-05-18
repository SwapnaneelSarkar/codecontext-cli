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
exports.runGenerate = runGenerate;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const chalk_1 = __importDefault(require("chalk"));
const fileScanner_1 = require("../parser/fileScanner");
const astParser_1 = require("../parser/astParser");
const dependencyMapper_1 = require("../parser/dependencyMapper");
const graphBuilder_1 = require("../graph/graphBuilder");
const contextWriter_1 = require("../writer/contextWriter");
const loadConfig_1 = require("../config/loadConfig");
const llmSummarizer_1 = require("../summarizer/llmSummarizer");
async function runGenerate(opts) {
    const targetDir = path.resolve(opts.targetDir);
    const config = (0, loadConfig_1.loadProjectConfig)(targetDir);
    if (opts.concurrency && config.llm) {
        config.llm.maxConcurrency = opts.concurrency;
    }
    if (opts.clearCache) {
        (0, llmSummarizer_1.clearSummaryCache)(targetDir);
    }
    opts.onProgress?.('scan');
    const allFiles = await (0, fileScanner_1.scanFiles)(targetDir, {
        followSymlinks: config.scan?.followSymlinks,
    });
    let files = allFiles;
    if (opts.maxFiles && opts.maxFiles > 0) {
        files = files.slice(0, opts.maxFiles);
    }
    if (opts.dryRun) {
        const est = (0, llmSummarizer_1.estimateCostUsd)(files.length);
        // eslint-disable-next-line no-console
        console.log(`\nDry run: ~${est.approxTokens} tokens · est. $${est.low.toFixed(2)}–$${est.high.toFixed(2)} USD\n`);
        return;
    }
    opts.onProgress?.('parse');
    let fileContexts = await (0, astParser_1.parseFilesAST)(files, targetDir);
    opts.onProgress?.('deps');
    const depMap = (0, dependencyMapper_1.mapDependencies)(fileContexts, targetDir);
    opts.onProgress?.('graph');
    const projectGraph = await (0, graphBuilder_1.buildDependencyGraph)(fileContexts, depMap);
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
        const ok = await (0, llmSummarizer_1.checkOllamaReachable)(base);
        if (!ok) {
            // eslint-disable-next-line no-console
            console.error(chalk_1.default.red('✗ Ollama is not running. Start it with: brew services start ollama\n' +
                '  Or run without LLM: codecontext generate --skip-llm'));
            skipLlmEffective = true;
        }
    }
    if (skipLlmEffective && provider === 'ollama') {
        fileContexts = fileContexts.map((fc) => (0, llmSummarizer_1.mergeDiagnostics)(fc, 'ollama:skipped'));
    }
    if (!skipLlmEffective) {
        const isPaidCloud = provider === 'anthropic' || provider === 'openai';
        if (isPaidCloud) {
            const est = (0, llmSummarizer_1.estimateCostUsd)(fileContexts.length);
            if (!opts.yes && process.stdin.isTTY) {
                // eslint-disable-next-line no-console
                console.log(`Estimated API cost (rough): $${est.low.toFixed(2)} – $${est.high.toFixed(2)} (~${est.approxTokens} tokens). Use --yes to skip this check.`);
            }
        }
        else if (provider === 'ollama' && process.stdin.isTTY) {
            // eslint-disable-next-line no-console
            console.log(chalk_1.default.gray('Using local Ollama (no API cost).\n'));
        }
        opts.onProgress?.('llm');
        const readContent = (rel) => fs.readFileSync(path.join(targetDir, rel), 'utf-8');
        fileContexts = await (0, llmSummarizer_1.summarizeFiles)(fileContexts, readContent, {
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
    await (0, contextWriter_1.writeContext)(fileContexts, projectGraph, targetDir, warnings);
}
//# sourceMappingURL=runGenerate.js.map