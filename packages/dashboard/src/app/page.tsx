'use client';

import { Sidebar } from '@/components/Sidebar';
import { readProjectIndex } from '@/lib/readContext';
import { useEffect, useState } from 'react';

export default function Home() {
  const [project, setProject] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const projectData = readProjectIndex();
    setProject(projectData);
    setIsLoading(false);
  }, []);

  return (
    <div className="flex h-screen bg-white">
      <Sidebar project={project} />

      <div className="flex-1 flex flex-col">
        <header className="border-b border-gray-200 p-6">
          <h2 className="text-2xl font-bold">Project Overview</h2>
          <p className="text-gray-600 mt-1">
            AI-friendly structured context of your codebase
          </p>
        </header>

        <main className="flex-1 overflow-auto p-6">
          {isLoading ? (
            <div className="flex items-center justify-center h-96">
              <p className="text-gray-500">Loading project...</p>
            </div>
          ) : project ? (
            <div className="max-w-4xl space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-muted p-6 rounded-lg border border-gray-200">
                  <h3 className="text-sm font-medium text-gray-600 mb-2">
                    Total Files
                  </h3>
                  <p className="text-3xl font-bold text-accent">
                    {project.totalFiles}
                  </p>
                </div>

                <div className="bg-muted p-6 rounded-lg border border-gray-200">
                  <h3 className="text-sm font-medium text-gray-600 mb-2">
                    Languages
                  </h3>
                  <p className="text-lg font-semibold text-gray-700">
                    {project.languages.join(', ')}
                  </p>
                </div>

                <div className="bg-muted p-6 rounded-lg border border-gray-200">
                  <h3 className="text-sm font-medium text-gray-600 mb-2">
                    Dependencies
                  </h3>
                  <p className="text-3xl font-bold text-accent">
                    {project.modules.length}
                  </p>
                </div>
              </div>

              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <h3 className="text-lg font-semibold mb-4">Project Summary</h3>
                <p className="text-gray-700 leading-relaxed">
                  This project contains{' '}
                  <strong>{project.totalFiles} files</strong> written in{' '}
                  <strong>{project.languages.join(', ')}</strong>. The codebase
                  has been scanned and indexed to provide AI-friendly context
                  for faster understanding by coding agents.
                </p>

                <div className="mt-6 pt-6 border-t border-gray-200">
                  <p className="text-sm text-gray-500">
                    Generated: {new Date(project.generatedAt).toLocaleString()}
                  </p>
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                <h3 className="text-sm font-semibold text-blue-900 mb-2">
                  Getting Started
                </h3>
                <ul className="text-sm text-blue-800 space-y-2">
                  <li>
                    📊 View the <strong>Dependency Graph</strong> to understand
                    module relationships
                  </li>
                  <li>
                    📁 Browse the <strong>File Browser</strong> to inspect
                    individual files
                  </li>
                  <li>
                    💾 Use the generated context files in{' '}
                    <code className="bg-white px-2 py-1 rounded text-xs">
                      .ai-context/
                    </code>
                  </li>
                </ul>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-96 text-center">
              <p className="text-gray-600 mb-4">No project loaded yet</p>
              <p className="text-sm text-gray-500 max-w-md">
                Run <code className="bg-muted px-2 py-1 rounded">codecontext generate</code> in your project directory to generate context
              </p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
