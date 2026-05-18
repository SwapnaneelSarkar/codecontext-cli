import type { ProjectIndex, ScoredFile } from '@codecontext/core';

/**
 * Load project index from the Next.js API route (server sets CODECONTEXT_PROJECT_ROOT).
 */
export async function fetchProjectIndex(): Promise<ProjectIndex | null> {
  try {
    const res = await fetch('/api/context', { cache: 'no-store' });
    if (!res.ok) return null;
    return (await res.json()) as ProjectIndex;
  } catch {
    return null;
  }
}

export async function fetchQueryResults(
  q: string
): Promise<{ query: string; results: ScoredFile[] } | null> {
  try {
    const res = await fetch(`/api/query?q=${encodeURIComponent(q)}`, {
      cache: 'no-store',
    });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}
