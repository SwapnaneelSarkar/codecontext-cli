import { FileContext } from '@codecontext/core';

/**
 * Map dependencies between files
 * TODO: Analyze import statements and cross-reference with other files
 */
export async function mapDependencies(fileContexts: FileContext[]): Promise<Map<string, string[]>> {
  const dependencyMap = new Map<string, string[]>();

  // TODO: Build a map of file -> dependencies by analyzing imports
  // This will be used to build the dependency graph

  for (const context of fileContexts) {
    dependencyMap.set(context.filePath, context.imports);
  }

  return dependencyMap;
}
