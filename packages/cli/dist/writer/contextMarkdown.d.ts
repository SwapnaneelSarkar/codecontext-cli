import type { FileContext, ProjectGraph } from '@codecontext/core';
type SummaryFields = Pick<FileContext, 'language' | 'exports' | 'functions' | 'dependencies' | 'apiUsage'>;
/**
 * Heuristic one-line summary from parsed FileContext (no LLM).
 */
export declare function buildFileSummaryFromContext(fc: SummaryFields): string;
export declare function buildContextMd(projectName: string, files: FileContext[], graph: ProjectGraph): string;
export declare function buildClaudeMemoryMd(projectName: string, files: FileContext[], graph: ProjectGraph): string;
export {};
//# sourceMappingURL=contextMarkdown.d.ts.map