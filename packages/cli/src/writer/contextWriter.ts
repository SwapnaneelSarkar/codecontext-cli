import * as fs from 'fs';
import * as path from 'path';
import { FileContext, ProjectGraph, ProjectIndex } from '@codecontext/core';

/**
 * Write generated context to .ai-context/ folder
 */
export async function writeContext(
  fileContexts: FileContext[],
  projectGraph: ProjectGraph,
  baseDir: string
): Promise<void> {
  const contextDir = path.join(baseDir, '.ai-context');
  const filesDir = path.join(contextDir, 'files');
  const modulesDir = path.join(contextDir, 'modules');

  // Ensure directories exist
  fs.mkdirSync(filesDir, { recursive: true });
  fs.mkdirSync(modulesDir, { recursive: true });

  // Write individual file contexts
  for (const context of fileContexts) {
    const safeFileName = context.filePath
      .replace(/[^a-zA-Z0-9-_]/g, '_')
      .toLowerCase();
    const filePath = path.join(filesDir, `${safeFileName}.json`);
    
    fs.writeFileSync(filePath, JSON.stringify(context, null, 2));
  }

  // Write dependency graph
  const graphPath = path.join(contextDir, 'graph.json');
  fs.writeFileSync(graphPath, JSON.stringify(projectGraph, null, 2));

  // Write project index
  const languages = Array.from(new Set(fileContexts.map((c) => c.language)));
  const modules = Array.from(new Set(fileContexts.flatMap((c) => c.dependencies)));

  const projectIndex: ProjectIndex = {
    projectName: path.basename(baseDir),
    generatedAt: new Date().toISOString(),
    totalFiles: fileContexts.length,
    languages,
    modules,
    files: fileContexts,
    graph: projectGraph,
  };

  const indexPath = path.join(contextDir, 'index.json');
  fs.writeFileSync(indexPath, JSON.stringify(projectIndex, null, 2));
}
