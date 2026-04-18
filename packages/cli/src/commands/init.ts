import { Command } from 'commander';
import chalk from 'chalk';
import { createSpinner } from '../utils/spinner';
import * as fs from 'fs';
import * as path from 'path';

export const initCommand = new Command('init')
  .description('Initialize .ai-context folder in your project')
  .action(async (options) => {
    const spinner = createSpinner('Initializing CodeContext...').start();

    try {
      const contextDir = path.join(process.cwd(), '.ai-context');
      
      // Create .ai-context directory and subdirectories
      fs.mkdirSync(contextDir, { recursive: true });
      fs.mkdirSync(path.join(contextDir, 'files'), { recursive: true });
      fs.mkdirSync(path.join(contextDir, 'modules'), { recursive: true });

      spinner.succeed(chalk.green('✓ CodeContext initialized successfully'));
      console.log(chalk.gray(`\nContext folder created at: ${chalk.white(contextDir)}`));
      console.log(chalk.gray('Next step: Run "codecontext generate" to scan your codebase\n'));
    } catch (error) {
      spinner.fail(chalk.red('✗ Failed to initialize CodeContext'));
      if (error instanceof Error) {
        console.error(chalk.red(error.message));
      }
      process.exit(1);
    }
  });
