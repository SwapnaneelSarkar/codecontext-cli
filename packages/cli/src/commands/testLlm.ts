import { Command } from 'commander';
import chalk from 'chalk';
import { loadProjectConfig } from '../config/loadConfig';
import { testOllamaOnFirstFile } from '../summarizer/llmSummarizer';
import { projectDirOption, resolveProjectRoot } from '../utils/projectRoot';

export const testLlmCommand = new Command('test-llm')
  .description('Test Ollama on the first scanned file (debug)')
  .option('-d, --dir <path>', 'Project root')
  .option('-p, --path <path>', 'Project root (same as --dir)')
  .argument('[path]', 'Project directory')
  .action(async (positionalPath: string | undefined, options: { dir?: string; path?: string }) => {
    const root = resolveProjectRoot(positionalPath, projectDirOption(options));
    const config = loadProjectConfig(root);
    try {
      await testOllamaOnFirstFile(root, config);
    } catch (e) {
      console.error(chalk.red(e instanceof Error ? e.message : String(e)));
      process.exit(1);
    }
  });
