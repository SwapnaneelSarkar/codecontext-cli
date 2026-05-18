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
exports.initCommand = void 0;
const commander_1 = require("commander");
const chalk_1 = __importDefault(require("chalk"));
const spinner_1 = require("../utils/spinner");
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const core_1 = require("@codecontext/core");
const projectRoot_1 = require("../utils/projectRoot");
exports.initCommand = new commander_1.Command('init')
    .description('Initialize .ai-context folder and default config in your project')
    .option('-d, --dir <path>', 'Project root (overrides positional [path])')
    .option('-p, --path <path>', 'Project root (same as --dir)')
    .argument('[path]', 'Project directory to initialize')
    .action(async (positionalPath, options) => {
    const projectRoot = (0, projectRoot_1.resolveProjectRoot)(positionalPath, (0, projectRoot_1.projectDirOption)(options));
    const spinner = (0, spinner_1.createSpinner)('Initializing CodeContext...').start();
    try {
        const contextDir = path.join(projectRoot, '.ai-context');
        fs.mkdirSync(contextDir, { recursive: true });
        fs.mkdirSync(path.join(contextDir, 'files'), { recursive: true });
        fs.mkdirSync(path.join(contextDir, 'modules'), { recursive: true });
        fs.mkdirSync(path.join(contextDir, 'cache'), { recursive: true });
        const rcPath = path.join(projectRoot, '.codecontextrc.json');
        if (!fs.existsSync(rcPath)) {
            fs.writeFileSync(rcPath, JSON.stringify(core_1.DEFAULT_CONFIG, null, 2) + '\n');
        }
        const gitignorePath = path.join(projectRoot, '.gitignore');
        const cacheLine = '\n# CodeContext local cache (keep generated JSON if you prefer)\n.ai-context/cache/\n';
        if (fs.existsSync(gitignorePath)) {
            const g = fs.readFileSync(gitignorePath, 'utf-8');
            if (!g.includes('.ai-context/cache')) {
                fs.appendFileSync(gitignorePath, cacheLine);
            }
        }
        else {
            fs.writeFileSync(path.join(projectRoot, '.gitignore'), cacheLine.trimStart());
        }
        spinner.succeed(chalk_1.default.green('✓ CodeContext initialized successfully'));
        console.log(chalk_1.default.gray(`\nContext folder: ${chalk_1.default.white(contextDir)}`));
        console.log(chalk_1.default.gray(`Config: ${chalk_1.default.white(rcPath)} (edit LLM model / scan options)`));
        console.log(chalk_1.default.gray('\nNext: run `codecontext generate` to scan. Markdown overview is written to `.ai-context/CONTEXT.md`. Commit `.ai-context/` (except cache/) if you want agents to share context.\n'));
    }
    catch (error) {
        spinner.fail(chalk_1.default.red('✗ Failed to initialize CodeContext'));
        if (error instanceof Error) {
            console.error(chalk_1.default.red(error.message));
        }
        process.exit(1);
    }
});
//# sourceMappingURL=init.js.map