#!/usr/bin/env node

import { Command } from 'commander';
import { initCommand } from './commands/init';
import { generateCommand } from './commands/generate';
import { queryCommand } from './commands/query';
import { updateCommand } from './commands/update';
import { statsCommand } from './commands/stats';
import { dashboardCommand } from './commands/dashboard';
import { promptCommand } from './commands/prompt';
import { testLlmCommand } from './commands/testLlm';

const program = new Command();

program
  .name('codecontext')
  .description('Generate AI-friendly context from your codebase')
  .version('0.1.0');

program.addCommand(initCommand);
program.addCommand(generateCommand);
program.addCommand(updateCommand);
program.addCommand(queryCommand);
program.addCommand(statsCommand);
program.addCommand(dashboardCommand);
program.addCommand(promptCommand);
program.addCommand(testLlmCommand);

program.parse(process.argv);

if (!process.argv.slice(2).length) {
  program.outputHelp();
}
