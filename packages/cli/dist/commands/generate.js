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
exports.generateCommand = void 0;
const commander_1 = require("commander");
const chalk_1 = __importDefault(require("chalk"));
const path = __importStar(require("path"));
const spinner_1 = require("../utils/spinner");
const runGenerate_1 = require("../pipeline/runGenerate");
const projectRoot_1 = require("../utils/projectRoot");
exports.generateCommand = new commander_1.Command('generate')
    .description('Scan codebase and generate AI-friendly context')
    .option('-d, --dir <path>', 'Project root (overrides positional [path])')
    .option('-p, --path <path>', 'Project root (same as --dir)')
    .option('--skip-llm', 'Skip LLM summarization (AST only)', false)
    .option('--dry-run', 'Estimate cost and exit without writing or calling APIs')
    .option('--yes', 'Skip cost confirmation prompt')
    .option('--max-files <n>', 'Maximum files to process', (v) => parseInt(v, 10), 0)
    .option('--concurrency <n>', 'LLM concurrency', (v) => parseInt(v, 10))
    .option('--anthropic-api-key <key>', 'Anthropic API key (prefer env)')
    .option('--openai-api-key <key>', 'OpenAI API key (prefer env)')
    .option('--clear-cache', 'Delete LLM summary cache before generate', false)
    .option('--debug-llm', 'Print LLM debug info to stderr', false)
    .argument('[path]', 'Project directory to scan')
    .action(async (positionalPath, options) => {
    const targetDir = (0, projectRoot_1.resolveProjectRoot)(positionalPath, (0, projectRoot_1.projectDirOption)(options));
    const spinner = (0, spinner_1.createSpinner)('Generating CodeContext...').start();
    try {
        await (0, runGenerate_1.runGenerate)({
            targetDir,
            skipLlm: options.skipLlm,
            dryRun: options.dryRun,
            yes: options.yes,
            maxFiles: options.maxFiles,
            concurrency: options.concurrency,
            anthropicApiKey: options.anthropicApiKey,
            openaiApiKey: options.openaiApiKey,
            clearCache: options.clearCache,
            debugLlm: options.debugLlm,
            onProgress: (phase, detail) => {
                if (phase === 'llm' &&
                    detail?.done !== undefined &&
                    detail?.total !== undefined &&
                    detail?.file) {
                    spinner.text = `Summarizing ${detail.done}/${detail.total}: ${detail.file}`;
                    return;
                }
                spinner.text =
                    phase === 'scan'
                        ? 'Scanning...'
                        : phase === 'parse'
                            ? 'Parsing...'
                            : phase === 'deps'
                                ? 'Mapping dependencies...'
                                : phase === 'graph'
                                    ? 'Building graph...'
                                    : phase === 'llm'
                                        ? 'LLM summaries...'
                                        : 'Writing...';
            },
        });
        if (options.dryRun) {
            spinner.stop();
            return;
        }
        spinner.succeed(chalk_1.default.green('✓ CodeContext generated successfully'));
        console.log(chalk_1.default.gray(`\nContext saved to: ${chalk_1.default.white(path.join(targetDir, '.ai-context'))}` +
            ` (overview: ${chalk_1.default.white(path.join(targetDir, '.ai-context', 'CONTEXT.md'))})`), '\n');
    }
    catch (error) {
        spinner.fail(chalk_1.default.red('✗ Failed to generate CodeContext'));
        if (error instanceof Error) {
            console.error(chalk_1.default.red(error.message));
        }
        process.exit(1);
    }
});
//# sourceMappingURL=generate.js.map