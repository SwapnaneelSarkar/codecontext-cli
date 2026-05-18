import { Command } from 'commander';
import chalk from 'chalk';
import * as fs from 'fs';
import * as path from 'path';
import type { ProjectIndex } from '@codecontext/core';
import { estimateCostUsd } from '../summarizer/llmSummarizer';
import { projectDirOption, resolveProjectRoot } from '../utils/projectRoot';

export const statsCommand = new Command('stats')
  .description('Show stats for generated .ai-context')
  .option('-d, --dir <path>', 'Project root (overrides positional [path])')
  .option('-p, --path <path>', 'Project root (same as --dir)')
  .argument('[path]', 'Project directory')
  .action((positionalPath: string | undefined, options: { dir?: string; path?: string }) => {
    const root = resolveProjectRoot(positionalPath, projectDirOption(options));
    const indexPath = path.join(root, '.ai-context', 'index.json');
    if (!fs.existsSync(indexPath)) {
      console.error(chalk.red(`No index at ${indexPath}`));
      process.exit(1);
    }
    const index = JSON.parse(fs.readFileSync(indexPath, 'utf-8')) as ProjectIndex;
    const est = estimateCostUsd(index.totalFiles);

    console.log(chalk.cyan.bold(`\n${index.projectName}`));
    console.log(chalk.gray(`Schema: ${index.schemaVersion} · CLI: ${index.cliVersion ?? '?'}`));
    console.log(chalk.gray(`Generated: ${index.generatedAt}`));
    console.log('');
    console.log(`Files: ${index.totalFiles}`);
    console.log(`Languages: ${index.languages.join(', ')}`);
    console.log(`Graph nodes: ${index.graph.nodes.length}`);
    console.log(`Graph edges: ${index.graph.edges.length}`);
    console.log(`Est. tokens (rough): ${est.approxTokens}`);
    if (index.warnings?.length) {
      console.log(chalk.yellow(`Warnings: ${index.warnings.length}`));
    }
    console.log('');
  });
