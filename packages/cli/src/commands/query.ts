import { Command } from 'commander';
import chalk from 'chalk';

export const queryCommand = new Command('query')
  .description('Query generated context (coming soon)')
  .argument('<question>', 'Question to ask about your codebase')
  .action((question) => {
    console.log(chalk.yellow('\n⚠ Query feature coming soon!\n'));
    console.log(chalk.gray('Question received: ') + chalk.white(question));
    console.log(chalk.gray('\nFor now, you can browse the generated context in the dashboard.\n'));
  });
