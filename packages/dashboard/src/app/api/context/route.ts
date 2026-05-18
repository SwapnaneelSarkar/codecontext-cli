import { NextResponse } from 'next/server';
import * as fs from 'fs';
import * as path from 'path';

export async function GET() {
  const root = process.env.CODECONTEXT_PROJECT_ROOT;
  if (!root) {
    return NextResponse.json(
      {
        error:
          'CODECONTEXT_PROJECT_ROOT is not set. Run: codecontext dashboard --dir <your-project>',
      },
      { status: 400 }
    );
  }

  const indexPath = path.join(root, '.ai-context', 'index.json');
  if (!fs.existsSync(indexPath)) {
    return NextResponse.json(
      {
        error:
          'No .ai-context/index.json found. Run codecontext generate in that project first.',
      },
      { status: 404 }
    );
  }

  try {
    const raw = fs.readFileSync(indexPath, 'utf-8');
    return NextResponse.json(JSON.parse(raw));
  } catch {
    return NextResponse.json({ error: 'Failed to read index.json' }, { status: 500 });
  }
}
