import { NextResponse } from 'next/server';
import * as fs from 'fs';
import * as path from 'path';
import type { ProjectIndex } from '@codecontext/core';
import { rankFilesByQuery } from '@codecontext/core';

export async function GET(request: Request) {
  const root = process.env.CODECONTEXT_PROJECT_ROOT;
  if (!root) {
    return NextResponse.json(
      { error: 'CODECONTEXT_PROJECT_ROOT is not set' },
      { status: 400 }
    );
  }

  const { searchParams } = new URL(request.url);
  const q = searchParams.get('q') ?? '';
  if (!q.trim()) {
    return NextResponse.json({ results: [] });
  }

  const indexPath = path.join(root, '.ai-context', 'index.json');
  if (!fs.existsSync(indexPath)) {
    return NextResponse.json({ error: 'No index' }, { status: 404 });
  }

  const index = JSON.parse(fs.readFileSync(indexPath, 'utf-8')) as ProjectIndex;
  const results = rankFilesByQuery(q, index.files, 20);
  return NextResponse.json({ query: q, results });
}
