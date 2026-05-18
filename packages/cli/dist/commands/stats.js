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
exports.statsCommand = void 0;
const commander_1 = require("commander");
const chalk_1 = __importDefault(require("chalk"));
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const llmSummarizer_1 = require("../summarizer/llmSummarizer");
const projectRoot_1 = require("../utils/projectRoot");
exports.statsCommand = new commander_1.Command('stats')
    .description('Show stats for generated .ai-context')
    .option('-d, --dir <path>', 'Project root (overrides positional [path])')
    .option('-p, --path <path>', 'Project root (same as --dir)')
    .argument('[path]', 'Project directory')
    .action((positionalPath, options) => {
    const root = (0, projectRoot_1.resolveProjectRoot)(positionalPath, (0, projectRoot_1.projectDirOption)(options));
    const indexPath = path.join(root, '.ai-context', 'index.json');
    if (!fs.existsSync(indexPath)) {
        console.error(chalk_1.default.red(`No index at ${indexPath}`));
        process.exit(1);
    }
    const index = JSON.parse(fs.readFileSync(indexPath, 'utf-8'));
    const est = (0, llmSummarizer_1.estimateCostUsd)(index.totalFiles);
    console.log(chalk_1.default.cyan.bold(`\n${index.projectName}`));
    console.log(chalk_1.default.gray(`Schema: ${index.schemaVersion} · CLI: ${index.cliVersion ?? '?'}`));
    console.log(chalk_1.default.gray(`Generated: ${index.generatedAt}`));
    console.log('');
    console.log(`Files: ${index.totalFiles}`);
    console.log(`Languages: ${index.languages.join(', ')}`);
    console.log(`Graph nodes: ${index.graph.nodes.length}`);
    console.log(`Graph edges: ${index.graph.edges.length}`);
    console.log(`Est. tokens (rough): ${est.approxTokens}`);
    if (index.warnings?.length) {
        console.log(chalk_1.default.yellow(`Warnings: ${index.warnings.length}`));
    }
    console.log('');
});
//# sourceMappingURL=stats.js.map