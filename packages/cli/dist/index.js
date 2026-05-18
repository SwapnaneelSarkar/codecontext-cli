#!/usr/bin/env node
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const commander_1 = require("commander");
const init_1 = require("./commands/init");
const generate_1 = require("./commands/generate");
const query_1 = require("./commands/query");
const update_1 = require("./commands/update");
const stats_1 = require("./commands/stats");
const dashboard_1 = require("./commands/dashboard");
const prompt_1 = require("./commands/prompt");
const testLlm_1 = require("./commands/testLlm");
const program = new commander_1.Command();
program
    .name('codecontext')
    .description('Generate AI-friendly context from your codebase')
    .version('0.1.0');
program.addCommand(init_1.initCommand);
program.addCommand(generate_1.generateCommand);
program.addCommand(update_1.updateCommand);
program.addCommand(query_1.queryCommand);
program.addCommand(stats_1.statsCommand);
program.addCommand(dashboard_1.dashboardCommand);
program.addCommand(prompt_1.promptCommand);
program.addCommand(testLlm_1.testLlmCommand);
program.parse(process.argv);
if (!process.argv.slice(2).length) {
    program.outputHelp();
}
//# sourceMappingURL=index.js.map