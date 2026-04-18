'use client';

import { ProjectGraph } from '@codecontext/core';

interface GraphViewProps {
  graph: ProjectGraph | null;
}

export function GraphView({ graph }: GraphViewProps) {
  if (!graph) {
    return (
      <div className="flex items-center justify-center h-96 bg-muted rounded-lg border border-gray-200">
        <p className="text-gray-500">No dependency graph available</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="bg-muted p-6 rounded-lg border border-gray-200">
        <h3 className="text-lg font-semibold mb-4">Dependency Graph</h3>
        
        <div className="space-y-2">
          <p className="text-sm text-gray-600">
            <strong>Nodes:</strong> {graph.nodes.length}
          </p>
          <p className="text-sm text-gray-600">
            <strong>Edges:</strong> {graph.edges.length}
          </p>
        </div>

        <div className="mt-6">
          <h4 className="text-sm font-medium mb-2">Nodes</h4>
          <div className="space-y-1 max-h-48 overflow-y-auto">
            {graph.nodes.slice(0, 10).map((node) => (
              <div
                key={node.id}
                className="text-sm p-2 bg-white rounded border border-gray-100"
              >
                <span className="font-mono text-xs bg-accent text-white px-2 py-1 rounded mr-2">
                  {node.type}
                </span>
                <span className="text-gray-700">{node.label}</span>
              </div>
            ))}
            {graph.nodes.length > 10 && (
              <p className="text-sm text-gray-500 p-2">
                + {graph.nodes.length - 10} more nodes
              </p>
            )}
          </div>
        </div>
      </div>

      <p className="text-xs text-gray-500">
        Tip: React Flow integration coming soon for interactive visualization
      </p>
    </div>
  );
}
