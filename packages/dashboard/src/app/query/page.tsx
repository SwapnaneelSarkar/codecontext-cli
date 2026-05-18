'use client';

import { Sidebar } from '@/components/Sidebar';
import { QueryResults } from '@/components/QueryResults';
import { fetchProjectIndex, fetchQueryResults } from '@/lib/readContext';
import type { ProjectIndex } from '@codecontext/core';
import type { ScoredFile } from '@codecontext/core';
import { useEffect, useState } from 'react';
import { Search } from 'lucide-react';

export default function QueryPage() {
  const [project, setProject] = useState<ProjectIndex | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<ScoredFile[]>([]);
  const [searching, setSearching] = useState(false);

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

  const runSearch = async (q: string) => {
    setQuery(q);
    if (!q.trim()) {
      setResults([]);
      return;
    }
    setSearching(true);
    const data = await fetchQueryResults(q);
    setSearching(false);
    if (data?.results) setResults(data.results);
    else setResults([]);
  };

  return (
    <div className="flex h-screen bg-white">
      <Sidebar project={project} />

      <div className="flex-1 flex flex-col">
        <header className="border-b border-gray-200 p-6">
          <h2 className="text-2xl font-bold">Query context</h2>
          <p className="text-gray-600 mt-1">
            Keyword search over file summaries (BM25)
          </p>
        </header>

        <main className="flex-1 overflow-auto p-6">
          {isLoading ? (
            <div className="flex items-center justify-center h-96">
              <p className="text-gray-500">Loading...</p>
            </div>
          ) : project ? (
            <div className="max-w-3xl space-y-6">
              <div className="relative">
                <Search className="absolute left-3 top-3 text-gray-400" size={18} />
                <input
                  type="text"
                  placeholder="e.g. Where is authentication handled?"
                  value={query}
                  onChange={(e) => runSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
                />
              </div>
              {searching ? (
                <p className="text-sm text-gray-500">Searching…</p>
              ) : (
                <QueryResults query={query} results={results} />
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-96 text-center">
              <p className="text-gray-600 mb-4">No project loaded</p>
              <p className="text-sm text-gray-500 max-w-md">
                Set CODECONTEXT_PROJECT_ROOT and run{' '}
                <code className="bg-muted px-2 py-1 rounded">codecontext generate</code>{' '}
                first.
              </p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
