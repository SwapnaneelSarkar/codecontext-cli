import { Command } from 'commander';
import chalk from 'chalk';
import { createSpinner } from '../utils/spinner';
import { runGenerate } from '../pipeline/runGenerate';
import { projectDirOption, resolveProjectRoot } from '../utils/projectRoot';

export const updateCommand = new Command('update')
  .description('Re-scan project and refresh .ai-context')
  .option('-d, --dir <path>', 'Project root (overrides positional [path])')
  .option('-p, --path <path>', 'Project root (same as --dir)')
  .option('--skip-llm', 'Skip LLM', false)
  .option('--yes', 'Skip cost confirmation', false)
  .argument('[path]', 'Project directory')
  .action(async (
    positionalPath: string | undefined,
    options: {
      dir?: string;
      path?: string;
      skipLlm: boolean;
      yes: boolean;
    }
  ) => {
    const targetDir = resolveProjectRoot(positionalPath, projectDirOption(options));
    const spinner = createSpinner('Updating CodeContext...').start();
    try {
      await runGenerate({
        targetDir,
        skipLlm: options.skipLlm,
        yes: options.yes,
        onProgress: () => {
          spinner.text = 'Working...';
        },
      });
      spinner.succeed(chalk.green('✓ Context updated'));
    } catch (error) {
      spinner.fail(chalk.red('✗ Update failed'));
      if (error instanceof Error) console.error(chalk.red(error.message));
      process.exit(1);
    }
  });
