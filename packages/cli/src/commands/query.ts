import { Command } from 'commander';
import chalk from 'chalk';
import * as fs from 'fs';
import * as path from 'path';
import type { ProjectIndex } from '@codecontext/core';
import { rankFilesByQuery } from '@codecontext/core';
import { projectDirOption, resolveProjectRoot } from '../utils/projectRoot';

export const queryCommand = new Command('query')
  .description('Search generated context (BM25 over summaries)')
  .option('-d, --dir <path>', 'Project root (overrides second positional [path])')
  .option('-p, --path <path>', 'Project root (same as --dir)')
  .argument('<question>', 'Question or keywords about your codebase')
  .argument('[path]', 'Project directory (default: current directory)')
  .action(
    (
      question: string,
      positionalPath: string | undefined,
      options: { dir?: string; path?: string }
    ) => {
      const root = resolveProjectRoot(
        positionalPath,
        projectDirOption(options)
      );
      const indexPath = path.join(root, '.ai-context', 'index.json');
      if (!fs.existsSync(indexPath)) {
        console.error(
          chalk.red(
            `No index at ${indexPath}. Run \`codecontext generate\` first.`
          )
        );
        process.exit(1);
      }

      let index: ProjectIndex;
      try {
        index = JSON.parse(fs.readFileSync(indexPath, 'utf-8')) as ProjectIndex;
      } catch {
        console.error(chalk.red('Failed to read index.json'));
        process.exit(1);
      }

      const ranked = rankFilesByQuery(question, index.files, 15);
      if (ranked.length === 0) {
        console.log(chalk.yellow('No matches.'));
        return;
      }

      console.log(chalk.cyan(`\nTop matches for: "${question}"\n`));
      for (const r of ranked) {
        console.log(chalk.white.bold(r.filePath));
        console.log(chalk.gray(`  score: ${r.score.toFixed(3)}`));
        console.log(chalk.gray(`  ${r.snippet}\n`));
      }
    }
  );
