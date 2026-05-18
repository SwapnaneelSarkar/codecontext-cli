import { Command } from 'commander';
import chalk from 'chalk';
import * as path from 'path';
import { createSpinner } from '../utils/spinner';
import { runGenerate } from '../pipeline/runGenerate';
import { projectDirOption, resolveProjectRoot } from '../utils/projectRoot';

export const generateCommand = new Command('generate')
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
  .action(async (positionalPath: string | undefined, options: {
    dir?: string;
    path?: string;
    skipLlm: boolean;
    dryRun?: boolean;
    yes?: boolean;
    maxFiles: number;
    concurrency?: number;
    anthropicApiKey?: string;
    openaiApiKey?: string;
    clearCache?: boolean;
    debugLlm?: boolean;
  }) => {
    const targetDir = resolveProjectRoot(positionalPath, projectDirOption(options));
    const spinner = createSpinner('Generating CodeContext...').start();

    try {
      await runGenerate({
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
          if (
            phase === 'llm' &&
            detail?.done !== undefined &&
            detail?.total !== undefined &&
            detail?.file
          ) {
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

      spinner.succeed(chalk.green('✓ CodeContext generated successfully'));
      console.log(
        chalk.gray(
          `\nContext saved to: ${chalk.white(path.join(targetDir, '.ai-context'))}` +
            ` (overview: ${chalk.white(path.join(targetDir, '.ai-context', 'CONTEXT.md'))})`
        ),
        '\n'
      );
    } catch (error) {
      spinner.fail(chalk.red('✗ Failed to generate CodeContext'));
      if (error instanceof Error) {
        console.error(chalk.red(error.message));
      }
      process.exit(1);
    }
  });
