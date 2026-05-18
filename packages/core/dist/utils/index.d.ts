/**
 * Utility functions shared across CLI and dashboard
 */
/**
 * Format a file path for display
 */
export declare function formatFilePath(filePath: string): string;
/**
 * Get file extension from path
 */
export declare function getFileExtension(filePath: string): string;
/**
 * Determine programming language from file extension
 */
export declare function getLanguageFromExtension(ext: string): string;
/**
 * Check if a file should be ignored during scanning
 */
export declare function shouldIgnoreFile(filePath: string): boolean;
/**
 * Generate a unique ID for a file or module
 */
export declare function generateId(filePath: string): string;
//# sourceMappingURL=index.d.ts.map