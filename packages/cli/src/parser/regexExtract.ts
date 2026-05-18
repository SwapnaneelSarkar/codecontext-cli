/**
 * Portable extraction when Tree-sitter is unavailable or as supplement.
 */

export interface ImportDetail {
  specifier: string;
  isDynamic: boolean;
}

export interface Extracted {
  imports: string[];
  importDetails: ImportDetail[];
  exports: string[];
  functions: string[];
  dependencies: string[];
}

function npmPackageName(spec: string): string | null {
  if (spec.startsWith('.') || spec.startsWith('/')) return null;
  if (spec.startsWith('@')) {
    const parts = spec.split('/');
    return parts.length >= 2 ? `${parts[0]}/${parts[1]}` : spec;
  }
  return spec.split('/')[0] ?? null;
}

function dartDependencyKey(spec: string): string | null {
  const s = spec.trim();
  if (s.startsWith('package:')) {
    const rest = s.slice('package:'.length);
    const root = rest.split('/')[0];
    return root || null;
  }
  if (s.startsWith('dart:')) {
    return s;
  }
  return null;
}

const DART_STMT_RESERVED = new Set([
  'if',
  'for',
  'while',
  'switch',
  'catch',
  'return',
  'throw',
  'assert',
  'await',
]);

export function extractDart(source: string): Extracted {
  const importDetails: ImportDetail[] = [];
  const exports: string[] = [];
  const functions: string[] = [];
  const dependencies = new Set<string>();

  const pushImp = (spec: string, isDynamic: boolean) => {
    const s = spec.trim();
    importDetails.push({ specifier: s, isDynamic });
    const k = dartDependencyKey(s);
    if (k) dependencies.add(k);
  };

  let m: RegExpExecArray | null;
  const importUri = /import\s+(?:[\w\s,{}*]*\s+)?['"]([^'"]+)['"]/g;
  const exportUri = /export\s+(?:[\w\s,{}*]*\s+)?['"]([^'"]+)['"]/g;
  const partUri = /part\s+['"]([^'"]+)['"]/g;
  while ((m = importUri.exec(source))) {
    pushImp(m[1], false);
  }
  while ((m = exportUri.exec(source))) {
    pushImp(m[1], false);
  }
  while ((m = partUri.exec(source))) {
    pushImp(m[1], false);
  }

  const classRe = /\bclass\s+(\w+)/g;
  const mixinRe = /\bmixin\s+(\w+)/g;
  const extRe = /\bextension\s+(\w+)\s+on\b/g;
  while ((m = classRe.exec(source))) exports.push(m[1]);
  while ((m = mixinRe.exec(source))) exports.push(m[1]);
  while ((m = extRe.exec(source))) exports.push(m[1]);

  const voidFn = /\bvoid\s+(\w+)\s*\(/g;
  while ((m = voidFn.exec(source))) {
    if (!DART_STMT_RESERVED.has(m[1])) functions.push(m[1]);
  }
  const futureFn = /\bFuture(?:<[^>]+>)?\s+(\w+)\s*\(/g;
  while ((m = futureFn.exec(source))) {
    if (!DART_STMT_RESERVED.has(m[1])) functions.push(m[1]);
  }
  const streamFn = /\bStream(?:<[^>]+>)?\s+(\w+)\s*\(/g;
  while ((m = streamFn.exec(source))) {
    if (!DART_STMT_RESERVED.has(m[1])) functions.push(m[1]);
  }

  const lineDecl =
    /^\s*(?:@\w+(?:\([^)]*\))?\s*)*(?:static\s+)?(?:async\s+)?(?:void|Future(?:<[^>]+>)?|Stream(?:<[^>]+>)?|[A-Za-z_]\w*(?:<[^>]*>)?)\s+(\w+)\s*\(/gm;
  while ((m = lineDecl.exec(source))) {
    const name = m[1];
    if (!DART_STMT_RESERVED.has(name)) functions.push(name);
  }

  const getter = /^\s*(\w+)\s+get\s+(\w+)\s*(?:=>|\{)/gm;
  while ((m = getter.exec(source))) {
    functions.push(m[2]);
  }
  const setter = /^\s*set\s+(\w+)\s*\(/gm;
  while ((m = setter.exec(source))) {
    functions.push(m[1]);
  }

  const lines = source.split('\n');
  for (let i = 0; i < lines.length; i++) {
    if (!/^\s*@override\b/.test(lines[i])) continue;
    for (let j = i + 1; j < Math.min(i + 8, lines.length); j++) {
      const line = lines[j];
      if (/^\s*$/.test(line)) continue;
      const mm = line.match(
        /^\s*(?:@\w+(?:\([^)]*\))?\s*)*(?:static\s+)?(?:async\s+)?(?:void|Future(?:<[^>]+>)?|[A-Za-z_]\w*(?:<[^>]*>)?)\s+(\w+)\s*\(/
      );
      if (mm && !DART_STMT_RESERVED.has(mm[1])) {
        functions.push(mm[1]);
        break;
      }
      if (/^\s*(?:@\w+)/.test(line)) continue;
      break;
    }
  }

  const uniqDetails: ImportDetail[] = [];
  const seen = new Set<string>();
  for (const d of importDetails) {
    const k = `${d.specifier}:${d.isDynamic}`;
    if (seen.has(k)) continue;
    seen.add(k);
    uniqDetails.push(d);
  }

  return {
    imports: uniqDetails.map((d) => d.specifier),
    importDetails: uniqDetails,
    exports: [...new Set(exports)],
    functions: [...new Set(functions)],
    dependencies: [...dependencies],
  };
}

export function extractJsTsLike(source: string): Extracted {
  const importDetails: ImportDetail[] = [];
  const exports: string[] = [];
  const functions: string[] = [];
  const dependencies = new Set<string>();

  const pushImp = (spec: string, isDynamic: boolean) => {
    importDetails.push({ specifier: spec, isDynamic });
    const pkg = npmPackageName(spec);
    if (pkg) dependencies.add(pkg);
  };

  const importRe =
    /import\s+(?:type\s+)?(?:(?:\{[^}]*\}|\*\s+as\s+\w+|\w+)(?:\s*,\s*(?:\{[^}]*\}|\*\s+as\s+\w+|\w+))?\s+from\s+)?['"]([^'"]+)['"]/g;
  const reqRe = /require\s*\(\s*['"]([^'"]+)['"]\s*\)/g;
  const dynImport = /import\s*\(\s*['"]([^'"]+)['"]\s*\)/g;

  let m: RegExpExecArray | null;
  while ((m = importRe.exec(source))) {
    pushImp(m[1], false);
  }
  while ((m = reqRe.exec(source))) {
    pushImp(m[1], false);
  }
  while ((m = dynImport.exec(source))) {
    pushImp(m[1], true);
  }

  const exportNamed = /export\s+(?:async\s+)?function\s+(\w+)/g;
  const exportConstFn =
    /export\s+const\s+(\w+)\s*=\s*(?:async\s*)?\(/g;
  const exportDefault = /export\s+default\s+(?:function\s+)?(\w+)/g;
  const exportNamedDecl = /export\s*\{\s*([^}]+)\s*\}/g;
  const exportClass = /export\s+class\s+(\w+)/g;

  while ((m = exportNamed.exec(source))) exports.push(m[1]);
  while ((m = exportConstFn.exec(source))) exports.push(m[1]);
  while ((m = exportDefault.exec(source))) exports.push(m[1]);
  while ((m = exportClass.exec(source))) exports.push(m[1]);
  while ((m = exportNamedDecl.exec(source))) {
    m[1].split(',').forEach((part) => {
      const name = part.trim().split(/\s+as\s+/)[0]?.trim();
      if (name) exports.push(name);
    });
  }

  const funcDecl = /(?:export\s+)?(?:async\s+)?function\s+(\w+)\s*\(/g;
  const arrow = /const\s+(\w+)\s*=\s*(?:async\s*)?\([^)]*\)\s*=>/g;
  while ((m = funcDecl.exec(source))) functions.push(m[1]);
  while ((m = arrow.exec(source))) functions.push(m[1]);

  const uniqDetails: ImportDetail[] = [];
  const seen = new Set<string>();
  for (const d of importDetails) {
    const k = `${d.specifier}:${d.isDynamic}`;
    if (seen.has(k)) continue;
    seen.add(k);
    uniqDetails.push(d);
  }

  return {
    imports: uniqDetails.map((d) => d.specifier),
    importDetails: uniqDetails,
    exports: [...new Set(exports)],
    functions: [...new Set(functions)],
    dependencies: [...dependencies],
  };
}

export function extractPython(source: string): Extracted {
  const importDetails: ImportDetail[] = [];
  const exports: string[] = [];
  const functions: string[] = [];
  const dependencies = new Set<string>();

  const fromImport = /^\s*from\s+([\w.]+)\s+import/gm;
  const plainImport = /^\s*import\s+([\w.]+)/gm;
  let m: RegExpExecArray | null;
  while ((m = fromImport.exec(source))) {
    importDetails.push({ specifier: m[1], isDynamic: false });
    dependencies.add(m[1].split('.')[0]);
  }
  while ((m = plainImport.exec(source))) {
    importDetails.push({ specifier: m[1], isDynamic: false });
    dependencies.add(m[1].split('.')[0]);
  }

  const defRe = /^\s*(?:async\s+)?def\s+(\w+)\s*\(/gm;
  while ((m = defRe.exec(source))) functions.push(m[1]);

  const dunderAll = /__all__\s*=\s*\[([^\]]+)\]/s.exec(source);
  if (dunderAll) {
    dunderAll[1]
      .split(',')
      .map((s) => s.trim().replace(/['"]/g, ''))
      .filter(Boolean)
      .forEach((e) => exports.push(e));
  }

  return {
    imports: [...new Set(importDetails.map((d) => d.specifier))],
    importDetails,
    exports: [...new Set(exports)],
    functions: [...new Set(functions)],
    dependencies: [...dependencies],
  };
}

export function extractGo(source: string): Extracted {
  const importDetails: ImportDetail[] = [];
  const functions: string[] = [];
  const dependencies = new Set<string>();

  const importBlock = /import\s*\(([\s\S]*?)\)/g;
  const importLine = /import\s+["']([^"']+)["']/g;
  let m: RegExpExecArray | null;
  let block: RegExpExecArray | null;
  while ((block = importBlock.exec(source))) {
    const inner = block[1];
    const lineRe = /"([^"]+)"/g;
    while ((m = lineRe.exec(inner))) {
      importDetails.push({ specifier: m[1], isDynamic: false });
      dependencies.add(m[1].split('/')[0]);
    }
  }
  while ((m = importLine.exec(source))) {
    importDetails.push({ specifier: m[1], isDynamic: false });
    dependencies.add(m[1].split('/')[0]);
  }

  const funcRe = /func\s+(?:\([^)]*\)\s*)?(\w+)\s*\(/g;
  while ((m = funcRe.exec(source))) {
    if (m[1][0] === m[1][0].toUpperCase() || m[1] === 'init') {
      functions.push(m[1]);
    } else {
      functions.push(m[1]);
    }
  }

  const exports = functions.filter((f) => /^[A-Z]/.test(f));

  return {
    imports: [...new Set(importDetails.map((d) => d.specifier))],
    importDetails,
    exports: [...new Set(exports)],
    functions: [...new Set(functions)],
    dependencies: [...dependencies],
  };
}
