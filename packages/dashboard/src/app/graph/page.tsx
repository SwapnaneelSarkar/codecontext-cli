'use client';

import { Sidebar } from '@/components/Sidebar';
import { GraphView } from '@/components/GraphView';
import { fetchProjectIndex } from '@/lib/readContext';
import type { ProjectIndex } from '@codecontext/core';
import { useEffect, useState } from 'react';

export default function GraphPage() {
  const [project, setProject] = useState<ProjectIndex | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    fetchProjectIndex().then((p) => {
      if (!cancelled) {
        setProject(p);
        setIsLoading(false);
      }
    });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="flex h-screen bg-white">
      <Sidebar project={project} />

      <div className="flex-1 flex flex-col">
        <header className="border-b border-gray-200 p-6">
          <h2 className="text-2xl font-bold">Dependency Graph</h2>
          <p className="text-gray-600 mt-1">
            Visualize relationships between modules and files
          </p>
        </header>

        <main className="flex-1 overflow-auto p-6">
          {isLoading ? (
            <div className="flex items-center justify-center h-96">
              <p className="text-gray-500">Loading project...</p>
            </div>
          ) : project ? (
            <div className="max-w-6xl">
              <GraphView graph={project.graph} />
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-96 text-center">
              <p className="text-gray-600 mb-4">No project loaded yet</p>
              <p className="text-sm text-gray-500">
                Generate context first to see the dependency graph
              </p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
