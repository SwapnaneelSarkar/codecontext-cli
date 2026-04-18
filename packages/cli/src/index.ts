#!/usr/bin/env node

import { Command } from 'commander';
import { initCommand } from './commands/init';
import { generateCommand } from './commands/generate';
import { queryCommand } from './commands/query';

const program = new Command();

program
  .name('codecontext')
  .description('Generate AI-friendly context from your codebase')
  .version('0.1.0');

// Register commands
program.addCommand(initCommand);
program.addCommand(generateCommand);
program.addCommand(queryCommand);

program.parse(process.argv);

// Show help if no command provided
if (!process.argv.slice(2).length) {
  program.outputHelp();
}
