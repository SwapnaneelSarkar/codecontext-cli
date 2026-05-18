"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DEFAULT_CONFIG = void 0;
exports.DEFAULT_CONFIG = {
    version: 1,
    include: ['**/*'],
    exclude: [],
    llm: {
        provider: 'ollama',
        model: 'codellama',
        temperature: 0.2,
        maxConcurrency: 2,
        ollamaUrl: 'http://localhost:11434',
        skipOnError: true,
    },
    scan: {
        followSymlinks: false,
    },
};
//# sourceMappingURL=config.js.map