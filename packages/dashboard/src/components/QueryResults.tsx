'use client';

import type { ScoredFile } from '@codecontext/core';

interface QueryResultsProps {
  query: string;
  results: ScoredFile[];
}

export function QueryResults({ query, results }: QueryResultsProps) {
  if (!query.trim()) {
    return (
      <p className="text-sm text-gray-500">Enter a question or keywords above.</p>
    );
  }

  if (results.length === 0) {
    return (
      <p className="text-sm text-gray-500">No matches for &quot;{query}&quot;.</p>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-600">
        {results.length} result{results.length === 1 ? '' : 's'} for &quot;{query}&quot;
      </p>
      <ul className="space-y-3">
        {results.map((r) => (
          <li
            key={r.filePath}
            className="border border-gray-200 rounded-lg p-4 bg-white shadow-sm"
          >
            <div className="font-mono text-sm text-sky-700 break-all">
              {r.filePath}
            </div>
            <div className="text-xs text-gray-500 mt-1">
              score: {r.score.toFixed(4)}
            </div>
            <p className="text-sm text-gray-700 mt-2">{r.snippet}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}
