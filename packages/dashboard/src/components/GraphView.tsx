'use client';

import { useEffect, useMemo } from 'react';
import type { ProjectGraph, GraphEdge, GraphNode } from '@codecontext/core';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  ReactFlowProvider,
  Handle,
  Position,
  type Node,
  type Edge,
  MarkerType,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import dagre from 'dagre';

interface GraphViewProps {
  graph: ProjectGraph | null;
}

const nodeWidth = 220;
const nodeHeight = 52;

const relationColor: Record<GraphEdge['relation'], string> = {
  imports: '#2563eb',
  calls: '#7c3aed',
  writes_to: '#dc2626',
  reads_from: '#059669',
};

function LabeledNode({ data }: { data: { label?: string } }) {
  return (
    <div className="text-[11px] leading-tight font-mono break-all max-w-[200px]">
      <Handle type="target" position={Position.Left} className="!bg-slate-400" />
      {data.label ?? ''}
      <Handle type="source" position={Position.Right} className="!bg-slate-400" />
    </div>
  );
}

const nodeTypes = { labeled: LabeledNode };

function nodeColor(type: GraphNode['type']): string {
  switch (type) {
    case 'file':
      return '#0ea5e9';
    case 'module':
      return '#8b5cf6';
    case 'db':
      return '#f97316';
    case 'api':
      return '#22c55e';
    default:
      return '#64748b';
  }
}

function layout(nodes: GraphNode[], edges: GraphEdge[]): { nodes: Node[]; edges: Edge[] } {
  const g = new dagre.graphlib.Graph().setDefaultEdgeLabel(() => ({}));
  g.setGraph({ rankdir: 'LR', nodesep: 60, ranksep: 90 });

  const idSet = new Set(nodes.map((n) => n.id));

  const rfNodes: Node[] = nodes.map((n) => ({
    id: n.id,
    type: 'labeled',
    data: { label: n.label },
    position: { x: 0, y: 0 },
    style: {
      border: `2px solid ${nodeColor(n.type)}`,
      borderRadius: 8,
      padding: 8,
      fontSize: 11,
      width: nodeWidth,
      background: '#fff',
    },
  }));

  rfNodes.forEach((n) => {
    g.setNode(n.id, { width: nodeWidth, height: nodeHeight });
  });

  edges.forEach((e) => {
    if (idSet.has(e.source) && idSet.has(e.target)) {
      g.setEdge(e.source, e.target);
    }
  });

  dagre.layout(g);

  const positioned = rfNodes.map((n) => {
    const pos = g.node(n.id);
    if (!pos) return n;
    return {
      ...n,
      position: {
        x: pos.x - nodeWidth / 2,
        y: pos.y - nodeHeight / 2,
      },
    };
  });

  const rfEdges: Edge[] = edges.map((e, i) => ({
    id: `e-${i}-${e.source}-${e.target}`,
    source: e.source,
    target: e.target,
    label: e.relation,
    animated: e.relation === 'imports',
    markerEnd: { type: MarkerType.ArrowClosed, color: relationColor[e.relation] },
    style: { stroke: relationColor[e.relation], strokeWidth: 1.5 },
  }));

  return { nodes: positioned, edges: rfEdges };
}

function GraphViewInner({ graph }: GraphViewProps) {
  const laidOut = useMemo(() => {
    if (!graph?.nodes?.length) return { nodes: [] as Node[], edges: [] as Edge[] };
    return layout(graph.nodes, graph.edges);
  }, [graph]);

  const [nodes, setNodes, onNodesChange] = useNodesState(laidOut.nodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(laidOut.edges);

  useEffect(() => {
    setNodes(laidOut.nodes);
    setEdges(laidOut.edges);
  }, [laidOut, setNodes, setEdges]);

  if (!graph?.nodes?.length) {
    return (
      <div className="flex items-center justify-center h-96 bg-muted rounded-lg border border-gray-200">
        <p className="text-gray-500">No dependency graph available</p>
      </div>
    );
  }

  return (
    <div className="h-[640px] w-full rounded-lg border border-gray-200 overflow-hidden bg-slate-50">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        fitView
        minZoom={0.2}
        maxZoom={1.5}
      >
        <Background />
        <Controls />
        <MiniMap />
      </ReactFlow>
      <p className="text-xs text-gray-500 p-2">
        Edge colors: imports (blue), calls (purple), reads_from (green), writes_to (red)
      </p>
    </div>
  );
}

export function GraphView(props: GraphViewProps) {
  return (
    <ReactFlowProvider>
      <GraphViewInner {...props} />
    </ReactFlowProvider>
  );
}
