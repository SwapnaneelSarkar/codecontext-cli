import type { FileContext, ProjectGraph } from '@codecontext/core';

const INTERESTING_FUNCS = new Set([
  'main',
  'build',
  'initState',
  'dispose',
  'createState',
  'didChangeDependencies',
]);

type SummaryFields = Pick<
  FileContext,
  'language' | 'exports' | 'functions' | 'dependencies' | 'apiUsage'
>;

/**
 * Heuristic one-line summary from parsed FileContext (no LLM).
 */
export function buildFileSummaryFromContext(fc: SummaryFields): string {
  const lang = fc.language;
  const exportNames = fc.exports.filter(Boolean);
  let exportPhrase =
    exportNames.length === 0
      ? 'no extracted top-level types'
      : exportNames.length === 1
        ? `\`${exportNames[0]}\``
        : `${exportNames.length} symbols (${exportNames
            .slice(0, 6)
            .map((n) => `\`${n}\``)
            .join(', ')}${exportNames.length > 6 ? ', …' : ''})`;

  if (lang === 'Dart' && exportNames.length > 0) {
    const widgetKind = fc.apiUsage.find(
      (a) => a === 'flutter:StatefulWidget' || a === 'flutter:StatelessWidget'
    );
    if (widgetKind) {
      const kind = widgetKind.replace('flutter:', '');
      const primary = exportNames[0];
      exportPhrase =
        exportNames.length === 1
          ? `${kind} \`${primary}\``
          : `${kind} \`${primary}\` (+ ${exportNames.length - 1} more types)`;
    }
  }

  const deps = [...new Set(fc.dependencies)]
    .filter((d) => d && !d.startsWith('.') && !d.startsWith('/'))
    .slice(0, 3);
  const depPhrase =
    deps.length > 0 ? deps.join(', ') : 'local/relative paths only';

  const n = fc.functions.length;
  const highlighted = fc.functions.filter((f) => INTERESTING_FUNCS.has(f));
  const rest = fc.functions.filter((f) => !INTERESTING_FUNCS.has(f));
  const keyNames = [
    ...new Set([...highlighted, ...rest.slice(0, Math.max(0, 5 - highlighted.length))]),
  ].slice(0, 6);
  const funcPhrase =
    n === 0
      ? 'no functions extracted'
      : n <= keyNames.length
        ? `${n} functions (${keyNames.map((x) => `\`${x}\``).join(', ')})`
        : `${n} functions including ${keyNames.map((x) => `\`${x}\``).join(', ')}`;

  return `${lang} file defining ${exportPhrase}. Imports from ${depPhrase}. Contains ${funcPhrase}.`;
}

function looksLikeFileSegment(segment: string): boolean {
  return segment.includes('.') && !segment.endsWith('/');
}

function moduleKeyForPath(filePath: string): string {
  const parts = filePath.split('/').filter(Boolean);
  if (parts.length === 0) return '/';
  if (parts[0] === 'lib') {
    if (parts.length >= 2 && !looksLikeFileSegment(parts[1])) {
      return `lib/${parts[1]}/`;
    }
    return 'lib/';
  }
  if (parts.length >= 2 && !looksLikeFileSegment(parts[1])) {
    return `${parts[0]}/${parts[1]}/`;
  }
  return `${parts[0]}/`;
}

function moduleDescription(files: FileContext[]): string {
  const langs = new Set(files.map((f) => f.language));
  const langsStr = [...langs].join(', ');
  const widgets = files.filter((f) =>
    f.apiUsage.some((a) => a.startsWith('flutter:') && a.includes('Widget'))
  ).length;
  const screensHint = files.filter((f) => /screen/i.test(f.filePath)).length;
  const parts: string[] = [`${files.length} ${langsStr} file(s)`];
  if (widgets) parts.push(`${widgets} with Flutter widgets`);
  if (screensHint) parts.push(`${screensHint} path(s) suggest UI/screens`);
  return parts.join('; ') + '.';
}

function buildTwoLevelTree(files: FileContext[]): string {
  const tree = new Map<string, Set<string>>();
  for (const f of files) {
    const parts = f.filePath.split('/').filter(Boolean);
    if (parts.length === 0) continue;
    const top = parts[0];
    if (!tree.has(top)) tree.set(top, new Set());
    if (parts.length >= 2) {
      const seg = parts[1];
      if (looksLikeFileSegment(seg)) {
        tree.get(top)!.add('(root files)');
      } else {
        tree.get(top)!.add(seg);
      }
    } else {
      tree.get(top)!.add('(files)');
    }
  }
  const tops = [...tree.keys()].sort();
  const lines: string[] = [];
  for (const top of tops) {
    const subs = [...tree.get(top)!].sort();
    if (subs.length === 1 && subs[0] === '(files)') {
      lines.push(`- \`${top}/\` — files at top level`);
    } else {
      lines.push(`- \`${top}/\``);
      for (const s of subs) {
        if (s === '(files)') lines.push(`  - (files)`);
        else if (s === '(root files)') {
          lines.push(`  - *(source files at \`${top}/\` root, e.g. \`main.dart\`)*`);
        }
        else lines.push(`  - \`${top}/${s}/\``);
      }
    }
  }
  return lines.join('\n');
}

function fileImportFanIn(graph: ProjectGraph): Map<string, number> {
  const fanIn = new Map<string, number>();
  for (const n of graph.nodes) {
    if (n.filePath) fanIn.set(n.filePath, 0);
  }
  for (const e of graph.edges) {
    const target = graph.nodes.find((n) => n.id === e.target);
    const p = target?.filePath;
    if (p) fanIn.set(p, (fanIn.get(p) ?? 0) + 1);
  }
  return fanIn;
}

function scoreKeyFile(fc: FileContext, fanIn: number): number {
  return (
    fanIn * 1000 +
    fc.functions.length * 10 +
    fc.exports.length * 5 +
    fc.imports.length
  );
}

function aggregateApiLabels(files: FileContext[]): Set<string> {
  const s = new Set<string>();
  for (const f of files) {
    for (const a of f.apiUsage) s.add(a);
  }
  return s;
}

function aggregateDbLabels(files: FileContext[]): Set<string> {
  const s = new Set<string>();
  for (const f of files) {
    for (const d of f.dbAccess) s.add(d);
  }
  return s;
}

export function buildContextMd(
  projectName: string,
  files: FileContext[],
  graph: ProjectGraph
): string {
  const languages = [...new Set(files.map((f) => f.language))].sort().join(', ');
  const fanIn = fileImportFanIn(graph);
  const ranked = [...files]
    .map((f) => ({ f, score: scoreKeyFile(f, fanIn.get(f.filePath) ?? 0) }))
    .sort((a, b) => b.score - a.score);
  const keyFiles = ranked.slice(0, 15).map((r) => r.f);

  const byModule = new Map<string, FileContext[]>();
  for (const f of files) {
    const k = moduleKeyForPath(f.filePath);
    const arr = byModule.get(k) ?? [];
    arr.push(f);
    byModule.set(k, arr);
  }
  const moduleEntries = [...byModule.entries()].sort(
    (a, b) => b[1].length - a[1].length
  );

  const moduleEdges = new Map<string, Map<string, number>>();
  for (const e of graph.edges) {
    const srcNode = graph.nodes.find((n) => n.id === e.source);
    const tgtNode = graph.nodes.find((n) => n.id === e.target);
    const sp = srcNode?.filePath;
    const tp = tgtNode?.filePath;
    if (!sp || !tp) continue;
    const sm = moduleKeyForPath(sp);
    const tm = moduleKeyForPath(tp);
    if (sm === tm) continue;
    if (!moduleEdges.has(sm)) moduleEdges.set(sm, new Map());
    const inner = moduleEdges.get(sm)!;
    inner.set(tm, (inner.get(tm) ?? 0) + 1);
  }

  const apiLabels = aggregateApiLabels(files);
  const stateMgmt = [...apiLabels].filter(
    (a) =>
      a.includes('provider') ||
      a.includes('riverpod') ||
      a.includes('bloc') ||
      a.includes('getx') ||
      (a.startsWith('flutter:') && a.includes('Widget'))
  );
  const httpLabels = [...apiLabels].filter(
    (a) =>
      a === 'dart:http' ||
      a === 'dart:dio' ||
      a.includes('GoRouter') ||
      a.includes('Navigator')
  );
  const dbLabels = aggregateDbLabels(files);

  const lines: string[] = [
    `# Project: ${projectName}`,
    '',
    `Generated: ${graph.generatedAt} | Files: ${files.length} | Languages: ${languages}`,
    '',
    '## Project Structure',
    '',
    buildTwoLevelTree(files),
    '',
    '## Modules',
    '',
  ];

  for (const [name, group] of moduleEntries) {
    lines.push(`### ${name}`);
    lines.push('');
    lines.push(moduleDescription(group));
    lines.push('');
  }

  lines.push('## Key Files', '');
  for (const f of keyFiles) {
    const fi = fanIn.get(f.filePath) ?? 0;
    const classes =
      f.exports.length > 0
        ? f.exports.slice(0, 12).map((x) => `\`${x}\``).join(', ')
        : '—';
    const funcs =
      f.functions.length > 0
        ? f.functions.slice(0, 10).map((x) => `\`${x}\``).join(', ')
        : '—';
    lines.push(`### \`${f.filePath}\``);
    lines.push('');
    lines.push(
      `**Imported by ~${fi} other file(s)** · ${f.functions.length} functions · ${f.exports.length} exports`
    );
    lines.push('');
    lines.push(`- **Classes / exports:** ${classes}`);
    lines.push(`- **Functions:** ${funcs}`);
    lines.push(`- **What it does:** ${f.summary || f.purpose}`);
    lines.push('');
  }

  lines.push('## Dependencies & Relationships', '');
  if (moduleEdges.size === 0) {
    lines.push('*(No cross-module import edges resolved, or single module.)*');
    lines.push('');
  } else {
    const rows: string[] = [];
    for (const [from, toMap] of [...moduleEdges.entries()].sort()) {
      for (const [to, count] of [...toMap.entries()].sort((a, b) => b[1] - a[1])) {
        rows.push(`- **${from}** → **${to}** (${count} import edge(s))`);
      }
    }
    lines.push(...rows.slice(0, 40));
    if (rows.length > 40) {
      lines.push(`- *… and ${rows.length - 40} more module pairs*`);
    }
    lines.push('');
  }

  lines.push('## State Management', '');
  if (stateMgmt.length === 0) {
    lines.push('*(No Provider/Riverpod/Bloc/GetX-style patterns detected in heuristics.)*');
  } else {
    for (const s of [...new Set(stateMgmt)].sort()) {
      lines.push(`- ${s}`);
    }
  }
  lines.push('');

  lines.push('## API & External Services', '');
  const extDepCounts = new Map<string, number>();
  for (const f of files) {
    for (const d of f.dependencies) {
      extDepCounts.set(d, (extDepCounts.get(d) ?? 0) + 1);
    }
  }
  if (httpLabels.length === 0 && extDepCounts.size === 0) {
    lines.push('*(No HTTP/Dio/routing heuristics or package dependencies extracted.)*');
  } else {
    for (const h of [...new Set(httpLabels)].sort()) {
      lines.push(`- ${h}`);
    }
    const topDeps = [...extDepCounts.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 20)
      .map(([d]) => d);
    if (topDeps.length) {
      lines.push('');
      lines.push('**Frequent package/SDK imports (from dependency extraction):**');
      for (const d of topDeps) {
        lines.push(`- ${d}`);
      }
    }
  }
  lines.push('');

  lines.push('## Database & Storage', '');
  if (dbLabels.size === 0) {
    lines.push('*(No database/storage heuristics matched in scanned files.)*');
  } else {
    for (const d of [...dbLabels].sort()) {
      lines.push(`- ${d}`);
    }
  }
  lines.push('');

  return lines.join('\n');
}

function findEntrypoints(files: FileContext[]): string[] {
  const paths = new Set<string>();
  for (const f of files) {
    const p = f.filePath.replace(/\\/g, '/');
    if (p.endsWith('main.dart')) paths.add(p);
    if (/router|routes|navigation/i.test(p) && p.endsWith('.dart')) paths.add(p);
    if (f.apiUsage.includes('flutter:GoRouter')) paths.add(p);
  }
  return [...paths].sort();
}

function inferProjectPurpose(files: FileContext[], projectName: string): string {
  const dart = files.filter((f) => f.language === 'Dart').length;
  const ts = files.filter((f) => f.language === 'TypeScript').length;
  const hasLib = files.some((f) => f.filePath.startsWith('lib/'));
  if (dart > 0 && hasLib) {
    return `**${projectName}** is a **Flutter/Dart** application (${dart} Dart files under this scan). Typical layout: \`lib/\` for app code, platform folders for iOS/Android.`;
  }
  if (ts > 0) {
    return `**${projectName}** is primarily **TypeScript/JavaScript** (${ts}+ TS/JS-related files in this index).`;
  }
  return `**${projectName}** — scanned codebase with languages: ${[...new Set(files.map((x) => x.language))].join(', ')}.`;
}

export function buildClaudeMemoryMd(
  projectName: string,
  files: FileContext[],
  graph: ProjectGraph
): string {
  const languages = [...new Set(files.map((f) => f.language))].sort().join(', ');
  const purpose = inferProjectPurpose(files, projectName);
  const structure = buildTwoLevelTree(files);
  const entrypoints = findEntrypoints(files);
  const apiLabels = aggregateApiLabels(files);
  const stateLines = [...apiLabels]
    .filter(
      (a) =>
        a.includes('provider') ||
        a.includes('riverpod') ||
        a.includes('bloc') ||
        a.includes('getx')
    )
    .sort();

  const byModule = new Map<string, FileContext[]>();
  for (const f of files) {
    const k = moduleKeyForPath(f.filePath);
    const arr = byModule.get(k) ?? [];
    arr.push(f);
    byModule.set(k, arr);
  }
  const topModules = [...byModule.entries()]
    .sort((a, b) => b[1].length - a[1].length)
    .slice(0, 12);

  const fanIn = fileImportFanIn(graph);
  const topKey = [...files]
    .map((f) => ({ f, score: scoreKeyFile(f, fanIn.get(f.filePath) ?? 0) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 12)
    .map((x) => x.f.filePath);

  const lines: string[] = [
    `# ${projectName} — codebase guide`,
    '',
    'This file is generated by CodeContext. Use it as the primary orientation doc before editing.',
    '',
    '## What this project is',
    '',
    purpose,
    '',
    `**Scan snapshot:** ${files.length} files · ${languages}`,
    '',
    '## Folder structure (top two levels)',
    '',
    structure,
    '',
    '## Entry points & routing',
    '',
  ];

  if (entrypoints.length) {
    for (const e of entrypoints) {
      lines.push(`- \`${e}\` — likely app entry, router, or navigation`);
    }
  } else {
    lines.push(
      '- No `main.dart` / obvious router path matched; search for `main(` or your framework’s bootstrap file.'
    );
  }
  lines.push('');

  lines.push('## State management (heuristic)', '');
  if (stateLines.length === 0) {
    lines.push(
      'No strong Provider/Riverpod/Bloc/GetX signals in the heuristic pass. Inspect `lib/` for `ChangeNotifier`, `Bloc`, `ref.watch`, etc.'
    );
  } else {
    for (const s of stateLines) {
      lines.push(`- ${s}`);
    }
  }
  lines.push('');

  lines.push('## Main modules (by path group)', '');
  for (const [name, group] of topModules) {
    lines.push(`- **${name}** — ${moduleDescription(group)}`);
  }
  lines.push('');

  lines.push(
    '## How to navigate',
    '',
    '1. Open **Key Files** in `.ai-context/CONTEXT.md` (highest fan-in + size heuristics).',
    '2. For any file, read `.ai-context/files/<slug>.json` for imports, functions, and `apiUsage`/`dbAccess` tags.',
    '3. **Dependency graph:** `.ai-context/graph.json` (nodes = files, edges = resolved imports).',
    '4. **Full index:** `.ai-context/index.json` lists all files and languages.',
    '',
    '### Highest-impact paths (start here)',
    '',
    ...topKey.map((p) => `- \`${p}\``),
    ''
  );

  return lines.join('\n');
}
