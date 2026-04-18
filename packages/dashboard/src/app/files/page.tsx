'use client';

import { Sidebar } from '@/components/Sidebar';
import { FileCard } from '@/components/FileCard';
import { readProjectIndex } from '@/lib/readContext';
import { useEffect, useState } from 'react';
import { Search } from 'lucide-react';

export default function FilesPage() {
  const [project, setProject] = useState(null);
  const [filteredFiles, setFilteredFiles] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const projectData = readProjectIndex();
    setProject(projectData);
    if (projectData) {
      setFilteredFiles(projectData.files);
    }
    setIsLoading(false);
  }, []);

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    if (!project) return;

    const filtered = project.files.filter(
      (file) =>
        file.filePath.toLowerCase().includes(query.toLowerCase()) ||
        file.language.toLowerCase().includes(query.toLowerCase()) ||
        file.summary.toLowerCase().includes(query.toLowerCase())
    );

    setFilteredFiles(filtered);
  };

  return (
    <div className="flex h-screen bg-white">
      <Sidebar project={project} />

      <div className="flex-1 flex flex-col">
        <header className="border-b border-gray-200 p-6">
          <h2 className="text-2xl font-bold">File Browser</h2>
          <p className="text-gray-600 mt-1">
            Explore files and their context
          </p>
        </header>

        <main className="flex-1 overflow-auto p-6">
          {isLoading ? (
            <div className="flex items-center justify-center h-96">
              <p className="text-gray-500">Loading project...</p>
            </div>
          ) : project ? (
            <div className="max-w-4xl">
              <div className="mb-6">
                <div className="relative">
                  <Search className="absolute left-3 top-3 text-gray-400" size={18} />
                  <input
                    type="text"
                    placeholder="Search files by name, language, or content..."
                    value={searchQuery}
                    onChange={(e) => handleSearch(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent"
                  />
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  Showing {filteredFiles.length} of {project.files.length} files
                </p>
              </div>

              <div className="space-y-3">
                {filteredFiles.length > 0 ? (
                  filteredFiles.map((file) => (
                    <FileCard key={file.filePath} file={file} />
                  ))
                ) : (
                  <div className="text-center py-12">
                    <p className="text-gray-500">
                      No files match your search
                    </p>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-96 text-center">
              <p className="text-gray-600 mb-4">No project loaded yet</p>
              <p className="text-sm text-gray-500">
                Generate context first to browse files
              </p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
