"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DEFAULT_CONFIG = void 0;
exports.DEFAULT_CONFIG = {
    version: 1,
    include: ['**/*'],
    exclude: [],
    llm: {
        provider: 'anthropic',
        model: 'claude-sonnet-4-20250514',
        temperature: 0.2,
        maxConcurrency: 3,
    },
    scan: {
        followSymlinks: false,
    },
};
//# sourceMappingURL=config.js.map