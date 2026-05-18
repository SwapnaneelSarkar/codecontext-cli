import * as fs from 'fs';
import * as path from 'path';

export function getCliVersion(): string {
  try {
    const pkgPath = path.join(__dirname, '..', 'package.json');
    const j = JSON.parse(fs.readFileSync(pkgPath, 'utf-8')) as { version?: string };
    return j.version ?? '0.1.0';
  } catch {
    return '0.1.0';
  }
}
