/**
 * Utility functions shared across CLI and dashboard
 */

/**
 * Format a file path for display
 */
export function formatFilePath(filePath: string): string {
  return filePath.replace(/\\/g, '/');
}

/**
 * Get file extension from path
 */
export function getFileExtension(filePath: string): string {
  const match = filePath.match(/\.([^.]+)$/);
  return match ? match[1] : '';
}

/**
 * Determine programming language from file extension
 */
export function getLanguageFromExtension(ext: string): string {
  const languageMap: Record<string, string> = {
    ts: 'TypeScript',
    tsx: 'TypeScript',
    js: 'JavaScript',
    jsx: 'JavaScript',
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
export function shouldIgnoreFile(filePath: string): boolean {
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
export function generateId(filePath: string): string {
  return filePath.replace(/[^a-zA-Z0-9-_]/g, '_').toLowerCase();
}
