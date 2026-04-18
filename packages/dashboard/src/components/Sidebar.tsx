'use client';

import { ProjectIndex } from '@codecontext/core';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Code, Network, FileText } from 'lucide-react';

interface SidebarProps {
  project: ProjectIndex | null;
}

export function Sidebar({ project }: SidebarProps) {
  const pathname = usePathname();

  const navItems = [
    { href: '/', label: 'Overview', icon: FileText },
    { href: '/graph', label: 'Dependency Graph', icon: Network },
    { href: '/files', label: 'File Browser', icon: Code },
  ];

  return (
    <div className="w-64 bg-muted border-r border-gray-200 flex flex-col h-screen">
      <div className="p-6 border-b border-gray-200">
        <h1 className="text-xl font-bold text-accent">CodeContext</h1>
        <p className="text-xs text-gray-500 mt-1">
          {project?.projectName || 'No project loaded'}
        </p>
      </div>

      <nav className="flex-1 p-4 space-y-1">
        {navItems.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className={`flex items-center gap-3 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              pathname === href
                ? 'bg-accent text-white'
                : 'text-gray-600 hover:bg-white'
            }`}
          >
            <Icon size={18} />
            {label}
          </Link>
        ))}
      </nav>

      {project && (
        <div className="border-t border-gray-200 p-4 space-y-3 text-xs">
          <div>
            <p className="text-gray-500 font-medium">Files</p>
            <p className="text-gray-700">{project.totalFiles}</p>
          </div>
          <div>
            <p className="text-gray-500 font-medium">Languages</p>
            <p className="text-gray-700">{project.languages.join(', ')}</p>
          </div>
          <div>
            <p className="text-gray-500 font-medium">Generated</p>
            <p className="text-gray-700">
              {new Date(project.generatedAt).toLocaleDateString()}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
