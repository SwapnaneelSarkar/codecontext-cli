import {
  FileContext,
  ProjectGraph,
  GraphNode,
  GraphEdge,
  generateId,
} from '@codecontext/core';
import type { DependencyMap } from '../parser/dependencyMapper';

function detectCycles(adj: Map<string, string[]>): string[] {
  const warnings: string[] = [];
  const visited = new Set<string>();
  const recStack = new Set<string>();

  const dfs = (u: string): void => {
    visited.add(u);
    recStack.add(u);
    for (const v of adj.get(u) ?? []) {
      if (!visited.has(v)) {
        dfs(v);
      } else if (recStack.has(v)) {
        warnings.push(`Import cycle: ${u} → ${v}`);
      }
    }
    recStack.delete(u);
  };

  for (const k of adj.keys()) {
    if (!visited.has(k)) dfs(k);
  }
  return [...new Set(warnings)].slice(0, 64);
}

function moduleLabelForPath(filePath: string): string | null {
  const norm = filePath.replace(/\\/g, '/');
  const srcIdx = norm.indexOf('/src/');
  if (srcIdx >= 0) {
    const rest = norm.slice(srcIdx + 5);
    const seg = rest.split('/')[0];
    return seg || null;
  }
  const pkg = norm.match(/^packages\/([^/]+)/);
  if (pkg) return pkg[1];
  return null;
}

/**
 * Build dependency graph from file contexts and resolved import map.
 */
export async function buildDependencyGraph(
  fileContexts: FileContext[],
  dependencyMap: DependencyMap
): Promise<ProjectGraph> {
  const nodes: GraphNode[] = [];
  const edges: GraphEdge[] = [];
  const now = new Date().toISOString();

  for (const context of fileContexts) {
    const node: GraphNode = {
      id: generateId(context.filePath),
      type: 'file',
      label: context.filePath,
      filePath: context.filePath,
      metadata: { file: context },
    };
    nodes.push(node);
  }

  const adj = new Map<string, string[]>();
  for (const c of fileContexts) {
    adj.set(c.filePath, []);
  }

  for (const context of fileContexts) {
    const resolved = dependencyMap.get(context.filePath);
    if (!resolved) continue;
    const fromId = generateId(context.filePath);
    for (const target of resolved.resolved) {
      const toId = generateId(target);
      edges.push({
        source: fromId,
        target: toId,
        relation: 'imports',
      });
      const list = adj.get(context.filePath);
      if (list && !list.includes(target)) list.push(target);
    }
  }

  const moduleClusters = new Map<string, string[]>();
  for (const c of fileContexts) {
    const ml = moduleLabelForPath(c.filePath);
    if (!ml) continue;
    const arr = moduleClusters.get(ml) ?? [];
    arr.push(generateId(c.filePath));
    moduleClusters.set(ml, arr);
  }

  for (const [name, ids] of moduleClusters) {
    if (ids.length < 2) continue;
    const id = `module_${generateId(name)}`;
    nodes.push({
      id,
      type: 'module',
      label: name,
      metadata: {
        moduleName: name,
        childFileIds: ids,
      },
    });
  }

  const dbIds = new Set<string>();
  const apiIds = new Set<string>();
  for (const c of fileContexts) {
    for (const d of c.dbAccess) {
      const id = `db_${generateId(d)}`;
      if (!dbIds.has(id)) {
        dbIds.add(id);
        nodes.push({
          id,
          type: 'db',
          label: d,
          metadata: { dbHint: d },
        });
      }
      edges.push({
        source: generateId(c.filePath),
        target: id,
        relation: 'reads_from',
      });
    }
    for (const a of c.apiUsage) {
      const id = `api_${generateId(a)}`;
      if (!apiIds.has(id)) {
        apiIds.add(id);
        nodes.push({
          id,
          type: 'api',
          label: a,
          metadata: { apiPath: a },
        });
      }
      edges.push({
        source: generateId(c.filePath),
        target: id,
        relation: 'calls',
      });
    }
  }

  const circularDependencyWarnings = detectCycles(adj);

  const graph: ProjectGraph = {
    version: '1',
    generatedAt: now,
    nodes,
    edges,
    circularDependencyWarnings,
  };

  return graph;
}
