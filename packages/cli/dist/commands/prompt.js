"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.promptCommand = void 0;
const commander_1 = require("commander");
const BLOCK = `When working in this repository, read \`.ai-context/index.json\` first for the project index, then per-file JSON under \`.ai-context/files/\` as needed. The dependency graph is in \`.ai-context/graph.json\`. Human-readable overview: \`.ai-context/CONTEXT.md\`.`;
exports.promptCommand = new commander_1.Command('prompt')
    .description('Print standard instructions for coding agents')
    .action(() => {
    console.log(BLOCK);
});
//# sourceMappingURL=prompt.js.map