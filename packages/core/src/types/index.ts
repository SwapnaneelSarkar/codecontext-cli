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
}

/**
 * Graph node representing a file, module, database, or API
 */
export interface GraphNode {
  id: string;
  type: 'file' | 'module' | 'db' | 'api';
  label: string;
  metadata: FileContext;
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
  nodes: GraphNode[];
  edges: GraphEdge[];
}

/**
 * Complete project index with all context information
 */
export interface ProjectIndex {
  projectName: string;
  generatedAt: string;
  totalFiles: number;
  languages: string[];
  modules: string[];
  files: FileContext[];
  graph: ProjectGraph;
}
