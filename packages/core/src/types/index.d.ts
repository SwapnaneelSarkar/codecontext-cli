/**
 * Schema version for .ai-context JSON files
 */
export declare const SCHEMA_VERSION = "1";
/**
 * Single import edge (static or dynamic)
 */
export interface ImportRecord {
    specifier: string;
    resolvedPath: string | null;
    isDynamic: boolean;
}
/**
 * File-level context information extracted during parsing
 */
export interface FileContext {
    filePath: string;
    language: string;
    purpose: string;
    exports: string[];
    imports: string[];
    functions: string[];
    dependencies: string[];
    dbAccess: string[];
    apiUsage: string[];
    summary: string;
    /** Parse or resolution warnings */
    diagnostics?: string[];
    /** Structured imports when available */
    importRecords?: ImportRecord[];
    /** LLM-enriched labels */
    tags?: string[];
    risks?: string[];
    entrypoints?: string[];
    relatedConcerns?: string[];
    /** sha256 of file content for incremental runs */
    contentHash?: string;
}
/**
 * Metadata attached to graph nodes; file nodes embed full FileContext
 */
export interface GraphNodeMetadata {
    /** When type is 'file', full context */
    file?: FileContext;
    /** Module aggregation */
    moduleName?: string;
    childFileIds?: string[];
    dbHint?: string;
    apiMethod?: string;
    apiPath?: string;
}
/**
 * Graph node representing a file, module, database, or API
 */
export interface GraphNode {
    id: string;
    type: 'file' | 'module' | 'db' | 'api';
    label: string;
    /** Relative file path when type is file */
    filePath?: string;
    metadata: GraphNodeMetadata;
}
/**
 * Edge representing relationships between graph nodes
 */
export interface GraphEdge {
    source: string;
    target: string;
    relation: 'imports' | 'calls' | 'writes_to' | 'reads_from';
}
/**
 * Project dependency graph structure
 */
export interface ProjectGraph {
    version: string;
    generatedAt: string;
    nodes: GraphNode[];
    edges: GraphEdge[];
    circularDependencyWarnings?: string[];
}
/**
 * Complete project index with all context information
 */
export interface ProjectIndex {
    schemaVersion: string;
    cliVersion?: string;
    projectName: string;
    generatedAt: string;
    totalFiles: number;
    languages: string[];
    modules: string[];
    files: FileContext[];
    graph: ProjectGraph;
    warnings?: string[];
}
/**
 * Per-file manifest entry for incremental updates
 */
export interface ManifestEntry {
    contentHash: string;
    summaryHash?: string;
    mtimeMs?: number;
}
export type ContextManifest = Record<string, ManifestEntry>;
//# sourceMappingURL=index.d.ts.map