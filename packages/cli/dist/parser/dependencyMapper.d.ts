import type { FileContext, ImportRecord } from '@codecontext/core';
export interface ResolvedForFile {
    resolved: string[];
    externals: string[];
    importRecords: ImportRecord[];
}
export type DependencyMap = Map<string, ResolvedForFile>;
/**
 * Build resolved dependency info per file (project-relative paths as keys).
 */
export declare function mapDependencies(fileContexts: FileContext[], projectRoot: string): DependencyMap;
//# sourceMappingURL=dependencyMapper.d.ts.map