"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateCommand = void 0;
const commander_1 = require("commander");
const chalk_1 = __importDefault(require("chalk"));
const spinner_1 = require("../utils/spinner");
const runGenerate_1 = require("../pipeline/runGenerate");
const projectRoot_1 = require("../utils/projectRoot");
exports.updateCommand = new commander_1.Command('update')
    .description('Re-scan project and refresh .ai-context')
    .option('-d, --dir <path>', 'Project root (overrides positional [path])')
    .option('-p, --path <path>', 'Project root (same as --dir)')
    .option('--skip-llm', 'Skip LLM', false)
    .option('--yes', 'Skip cost confirmation', false)
    .argument('[path]', 'Project directory')
    .action(async (positionalPath, options) => {
    const targetDir = (0, projectRoot_1.resolveProjectRoot)(positionalPath, (0, projectRoot_1.projectDirOption)(options));
    const spinner = (0, spinner_1.createSpinner)('Updating CodeContext...').start();
    try {
        await (0, runGenerate_1.runGenerate)({
            targetDir,
            skipLlm: options.skipLlm,
            yes: options.yes,
            onProgress: () => {
                spinner.text = 'Working...';
            },
        });
        spinner.succeed(chalk_1.default.green('✓ Context updated'));
    }
    catch (error) {
        spinner.fail(chalk_1.default.red('✗ Update failed'));
        if (error instanceof Error)
            console.error(chalk_1.default.red(error.message));
        process.exit(1);
    }
});
//# sourceMappingURL=update.js.map