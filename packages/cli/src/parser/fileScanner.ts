import * as fs from 'fs';
import * as path from 'path';
import ignore from 'ignore';

const DEFAULT_IGNORE = `
node_modules/
.git/
.ai-context/
.next/
dist/
build/
coverage/
.turbo/
*.log
.env
.env.*
!.env.example
ios/Pods/
ios/.symlinks/
android/.gradle/
android/build/
.dart_tool/
.flutter-plugins
.flutter-plugins-dependencies
pubspec.lock
**/*.g.dart
**/*.freezed.dart
`;

const SOURCE_EXTENSIONS = new Set([
  'ts',
  'tsx',
  'js',
  'jsx',
  'mjs',
  'cjs',
  'py',
  'go',
  'dart',
]);

export interface ScanOptions {
  followSymlinks?: boolean;
}

/**
 * Paths always skipped, even if .gitignore negates them (Pods, build outputs, etc.).
 */
export function shouldHardExclude(relativePosixPath: string, baseName: string): boolean {
  const norm = relativePosixPath.replace(/\\/g, '/');
  const segments = norm.split('/').filter(Boolean);

  const segmentBlocklist = new Set([
    'node_modules',
    '.git',
    '.ai-context',
    '.dart_tool',
  ]);
  for (const seg of segments) {
    if (segmentBlocklist.has(seg)) return true;
  }

  if (/(^|\/)ios\/Pods(\/|$)/.test(norm)) return true;
  if (/(^|\/)ios\/\.symlinks(\/|$)/.test(norm)) return true;
  if (/(^|\/)android\/\.gradle(\/|$)/.test(norm)) return true;
  if (norm === 'android/build' || norm.startsWith('android/build/')) return true;
  if (norm === 'build' || norm.startsWith('build/')) return true;

  if (
    baseName === '.flutter-plugins' ||
    baseName === '.flutter-plugins-dependencies' ||
    baseName === 'pubspec.lock'
  ) {
    return true;
  }
  if (baseName.endsWith('.g.dart') || baseName.endsWith('.freezed.dart')) {
    return true;
  }

  return false;
}

function loadGitignoreMatchers(targetDir: string): ReturnType<typeof ignore> {
  const ig = ignore();
  ig.add(DEFAULT_IGNORE);
  const gitignorePath = path.join(targetDir, '.gitignore');
  if (fs.existsSync(gitignorePath)) {
    const text = fs.readFileSync(gitignorePath, 'utf-8');
    ig.add(text);
  }
  const ccIgnore = path.join(targetDir, '.codecontextignore');
  if (fs.existsSync(ccIgnore)) {
    ig.add(fs.readFileSync(ccIgnore, 'utf-8'));
  }
  return ig;
}

function isSourceFile(filePath: string): boolean {
  const ext = path.extname(filePath).replace(/^\./, '').toLowerCase();
  return SOURCE_EXTENSIONS.has(ext);
}

/**
 * Recursively scan directory and return source file paths (absolute).
 */
export async function scanFiles(
  targetDir: string,
  options: ScanOptions = {}
): Promise<string[]> {
  const files: string[] = [];
  const ig = loadGitignoreMatchers(targetDir);
  const followSymlinks = options.followSymlinks === true;

  function walkDir(dir: string): void {
    let entries: fs.Dirent[];
    try {
      entries = fs.readdirSync(dir, { withFileTypes: true });
    } catch {
      return;
    }

    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      const relativePath = path.relative(targetDir, fullPath).split(path.sep).join('/');

      if (!followSymlinks && entry.isSymbolicLink()) {
        continue;
      }

      if (shouldHardExclude(relativePath, entry.name)) {
        continue;
      }

      if (entry.isDirectory()) {
        if (ig.ignores(relativePath + '/')) {
          continue;
        }
        walkDir(fullPath);
        continue;
      }

      if (!entry.isFile()) continue;
      if (ig.ignores(relativePath)) continue;
      if (!isSourceFile(fullPath)) continue;

      files.push(fullPath);
    }
  }

  walkDir(targetDir);
  return files;
}
