"use strict";
/**
 * Utility functions shared across CLI and dashboard
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.formatFilePath = formatFilePath;
exports.getFileExtension = getFileExtension;
exports.getLanguageFromExtension = getLanguageFromExtension;
exports.shouldIgnoreFile = shouldIgnoreFile;
exports.generateId = generateId;
/**
 * Format a file path for display
 */
function formatFilePath(filePath) {
    return filePath.replace(/\\/g, '/');
}
/**
 * Get file extension from path
 */
function getFileExtension(filePath) {
    const match = filePath.match(/\.([^.]+)$/);
    return match ? match[1] : '';
}
/**
 * Determine programming language from file extension
 */
function getLanguageFromExtension(ext) {
    const languageMap = {
        ts: 'TypeScript',
        tsx: 'TypeScript',
        js: 'JavaScript',
        jsx: 'JavaScript',
        mjs: 'JavaScript',
        cjs: 'JavaScript',
        py: 'Python',
        go: 'Go',
        rs: 'Rust',
        java: 'Java',
        cs: 'C#',
        cpp: 'C++',
        c: 'C',
        json: 'JSON',
        yaml: 'YAML',
        yml: 'YAML',
        md: 'Markdown',
    };
    return languageMap[ext.toLowerCase()] || 'Unknown';
}
/**
 * Check if a file should be ignored during scanning
 */
function shouldIgnoreFile(filePath) {
    const ignoredPatterns = [
        'node_modules',
        '.git',
        '.next',
        'dist',
        'build',
        '.ai-context',
        '.env',
    ];
    return ignoredPatterns.some((pattern) => filePath.includes(pattern));
}
/**
 * Generate a unique ID for a file or module
 */
function generateId(filePath) {
    return filePath.replace(/[^a-zA-Z0-9-_]/g, '_').toLowerCase();
}
//# sourceMappingURL=index.js.map