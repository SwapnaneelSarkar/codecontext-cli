'use client';

import { FileContext } from '@codecontext/core';
import { ChevronDown } from 'lucide-react';
import { useState } from 'react';

interface FileCardProps {
  file: FileContext;
}

export function FileCard({ file }: FileCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition-shadow">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full p-4 flex items-start gap-3 hover:bg-muted transition-colors"
      >
        <ChevronDown
          size={20}
          className={`mt-0.5 flex-shrink-0 transition-transform ${
            isExpanded ? 'rotate-180' : ''
          }`}
        />
        <div className="flex-1 text-left">
          <div className="font-mono text-sm text-accent break-all">
            {file.filePath}
          </div>
          <div className="text-xs text-gray-500 mt-1">
            {file.language} • {file.summary}
          </div>
        </div>
      </button>

      {isExpanded && (
        <div className="border-t border-gray-200 p-4 space-y-4 bg-muted">
          <div>
            <h4 className="text-sm font-semibold text-gray-700 mb-2">
              Summary
            </h4>
            <p className="text-sm text-gray-600">{file.summary}</p>
          </div>

          {file.exports.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold text-gray-700 mb-2">
                Exports ({file.exports.length})
              </h4>
              <div className="flex flex-wrap gap-1">
                {file.exports.map((exp) => (
                  <span
                    key={exp}
                    className="bg-white border border-gray-200 rounded px-2 py-1 text-xs text-gray-600"
                  >
                    {exp}
                  </span>
                ))}
              </div>
            </div>
          )}

          {file.imports.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold text-gray-700 mb-2">
                Imports ({file.imports.length})
              </h4>
              <div className="flex flex-wrap gap-1">
                {file.imports.slice(0, 5).map((imp) => (
                  <span
                    key={imp}
                    className="bg-white border border-gray-200 rounded px-2 py-1 text-xs text-gray-600"
                  >
                    {imp}
                  </span>
                ))}
                {file.imports.length > 5 && (
                  <span className="bg-white border border-gray-200 rounded px-2 py-1 text-xs text-gray-500">
                    +{file.imports.length - 5} more
                  </span>
                )}
              </div>
            </div>
          )}

          {file.functions.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold text-gray-700 mb-2">
                Functions ({file.functions.length})
              </h4>
              <div className="text-sm text-gray-600">
                {file.functions.slice(0, 3).join(', ')}
                {file.functions.length > 3 && (
                  <> and {file.functions.length - 3} more</>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
