"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.testLlmCommand = void 0;
const commander_1 = require("commander");
const chalk_1 = __importDefault(require("chalk"));
const loadConfig_1 = require("../config/loadConfig");
const llmSummarizer_1 = require("../summarizer/llmSummarizer");
const projectRoot_1 = require("../utils/projectRoot");
exports.testLlmCommand = new commander_1.Command('test-llm')
    .description('Test Ollama on the first scanned file (debug)')
    .option('-d, --dir <path>', 'Project root')
    .option('-p, --path <path>', 'Project root (same as --dir)')
    .argument('[path]', 'Project directory')
    .action(async (positionalPath, options) => {
    const root = (0, projectRoot_1.resolveProjectRoot)(positionalPath, (0, projectRoot_1.projectDirOption)(options));
    const config = (0, loadConfig_1.loadProjectConfig)(root);
    try {
        await (0, llmSummarizer_1.testOllamaOnFirstFile)(root, config);
    }
    catch (e) {
        console.error(chalk_1.default.red(e instanceof Error ? e.message : String(e)));
        process.exit(1);
    }
});
//# sourceMappingURL=testLlm.js.map