import { Command } from 'commander';
import chalk from 'chalk';
import { createSpinner } from '../utils/spinner';
import * as fs from 'fs';
import * as path from 'path';
import { DEFAULT_CONFIG } from '@codecontext/core';
import { projectDirOption, resolveProjectRoot } from '../utils/projectRoot';

export const initCommand = new Command('init')
  .description('Initialize .ai-context folder and default config in your project')
  .option('-d, --dir <path>', 'Project root (overrides positional [path])')
  .option('-p, --path <path>', 'Project root (same as --dir)')
  .argument('[path]', 'Project directory to initialize')
  .action(async (positionalPath: string | undefined, options: { dir?: string; path?: string }) => {
    const projectRoot = resolveProjectRoot(positionalPath, projectDirOption(options));
    const spinner = createSpinner('Initializing CodeContext...').start();

    try {
      const contextDir = path.join(projectRoot, '.ai-context');

      fs.mkdirSync(contextDir, { recursive: true });
      fs.mkdirSync(path.join(contextDir, 'files'), { recursive: true });
      fs.mkdirSync(path.join(contextDir, 'modules'), { recursive: true });
      fs.mkdirSync(path.join(contextDir, 'cache'), { recursive: true });

      const rcPath = path.join(projectRoot, '.codecontextrc.json');
      if (!fs.existsSync(rcPath)) {
        fs.writeFileSync(
          rcPath,
          JSON.stringify(DEFAULT_CONFIG, null, 2) + '\n'
        );
      }

      const gitignorePath = path.join(projectRoot, '.gitignore');
      const cacheLine = '\n# CodeContext local cache (keep generated JSON if you prefer)\n.ai-context/cache/\n';
      if (fs.existsSync(gitignorePath)) {
        const g = fs.readFileSync(gitignorePath, 'utf-8');
        if (!g.includes('.ai-context/cache')) {
          fs.appendFileSync(gitignorePath, cacheLine);
        }
      } else {
        fs.writeFileSync(
          path.join(projectRoot, '.gitignore'),
          cacheLine.trimStart()
        );
      }

      spinner.succeed(chalk.green('✓ CodeContext initialized successfully'));
      console.log(chalk.gray(`\nContext folder: ${chalk.white(contextDir)}`));
      console.log(
        chalk.gray(
          `Config: ${chalk.white(rcPath)} (edit LLM model / scan options)`
        )
      );
      console.log(
        chalk.gray(
          '\nNext: run `codecontext generate` to scan. Markdown overview is written to `.ai-context/CONTEXT.md`. Commit `.ai-context/` (except cache/) if you want agents to share context.\n'
        )
      );
    } catch (error) {
      spinner.fail(chalk.red('✗ Failed to initialize CodeContext'));
      if (error instanceof Error) {
        console.error(chalk.red(error.message));
      }
      process.exit(1);
    }
  });
