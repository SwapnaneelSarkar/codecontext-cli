import { Command } from 'commander';
import chalk from 'chalk';
import { createSpinner } from '../utils/spinner';
import { scanFiles } from '../parser/fileScanner';
import { parseFilesAST } from '../parser/astParser';
import { buildDependencyGraph } from '../graph/graphBuilder';
import { writeContext } from '../writer/contextWriter';
import * as path from 'path';

export const generateCommand = new Command('generate')
  .description('Scan codebase and generate AI-friendly context')
  .option('-d, --dir <path>', 'Directory to scan (default: current directory)', process.cwd())
  .action(async (options) => {
    const spinner = createSpinner('Generating CodeContext...').start();

    try {
      const targetDir = path.resolve(options.dir);
      
      // Step 1: Scan files
      spinner.text = 'Scanning files...';
      const files = await scanFiles(targetDir);
      spinner.text = `Found ${files.length} files`;

      // Step 2: Parse files (stubbed)
      spinner.text = 'Parsing files...';
      const fileContexts = await parseFilesAST(files, targetDir);

      // Step 3: Build dependency graph (stubbed)
      spinner.text = 'Building dependency graph...';
      const projectGraph = await buildDependencyGraph(fileContexts);

      // Step 4: Write context
      spinner.text = 'Writing context files...';
      await writeContext(fileContexts, projectGraph, targetDir);

      spinner.succeed(chalk.green('✓ CodeContext generated successfully'));
      console.log(chalk.gray(`\nContext saved to: ${chalk.white(path.join(targetDir, '.ai-context'))}`));
      console.log(chalk.gray(`Total files processed: ${chalk.white(files.length)}\n`));
    } catch (error) {
      spinner.fail(chalk.red('✗ Failed to generate CodeContext'));
      if (error instanceof Error) {
        console.error(chalk.red(error.message));
      }
      process.exit(1);
    }
  });
