import * as fs from 'fs';
import * as path from 'path';
import { shouldIgnoreFile } from '@codecontext/core';

/**
 * Recursively scan directory and return all source files
 * TODO: Ignore patterns (node_modules, .git, .next, dist, build, .ai-context)
 */
export async function scanFiles(targetDir: string): Promise<string[]> {
  const files: string[] = [];

  function walkDir(dir: string): void {
    try {
      const entries = fs.readdirSync(dir, { withFileTypes: true });

      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        const relativePath = path.relative(targetDir, fullPath);

        // Skip ignored files and directories
        if (shouldIgnoreFile(relativePath)) {
          continue;
        }

        if (entry.isDirectory()) {
          walkDir(fullPath);
        } else if (entry.isFile()) {
          files.push(fullPath);
        }
      }
    } catch (error) {
      console.error(`Error reading directory ${dir}:`, error);
    }
  }

  walkDir(targetDir);
  return files;
}
