import { FileContext, ProjectGraph } from '@codecontext/core';
import type { DependencyMap } from '../parser/dependencyMapper';
/**
 * Build dependency graph from file contexts and resolved import map.
 */
export declare function buildDependencyGraph(fileContexts: FileContext[], dependencyMap: DependencyMap): Promise<ProjectGraph>;
//# sourceMappingURL=graphBuilder.d.ts.map