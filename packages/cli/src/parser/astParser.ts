import * as fs from 'fs';
import * as path from 'path';
import {
  FileContext,
  getLanguageFromExtension,
  getFileExtension,
  type ImportRecord,
} from '@codecontext/core';
import { sha256Hex } from '../utils/hash';
import { detectApiUsage, detectDbAccess } from './heuristics';
import {
  extractDart,
  extractGo,
  extractJsTsLike,
  extractPython,
  type Extracted,
} from './regexExtract';
import {
  tryParseGoTreeSitter,
  tryParsePythonTreeSitter,
  tryParseWithTreeSitter,
} from './treeSitterOptional';
import { buildFileSummaryFromContext } from '../writer/contextMarkdown';

function firstCommentPurpose(source: string, language: string): string {
  const block = /^\s*\/\*\*?([\s\S]*?)\*\//m.exec(source);
  if (block) {
    return block[1].replace(/^\s*\*\s?/gm, ' ').trim().slice(0, 200);
  }
  if (language === 'Python') {
    const doc = /^\s*"""([\s\S]*?)"""/m.exec(source);
    if (doc) return doc[1].trim().slice(0, 200);
  }
  if (language === 'Dart') {
    const docLines: string[] = [];
    for (const line of source.split('\n')) {
      const dm = line.match(/^\s*\/\/\/\s?(.*)$/);
      if (dm) docLines.push(dm[1]);
      else if (docLines.length) break;
    }
    if (docLines.length) {
      return docLines.join(' ').trim().slice(0, 200);
    }
  }
  return '';
}

function buildImportRecords(extracted: Extracted): ImportRecord[] {
  return extracted.importDetails.map((d) => ({
    specifier: d.specifier,
    resolvedPath: null,
    isDynamic: d.isDynamic,
  }));
}

export async function parseFilesAST(
  files: string[],
  baseDir: string
): Promise<FileContext[]> {
  const fileContexts: FileContext[] = [];

  for (const filePath of files) {
    try {
      const relativeFilePath = path.relative(baseDir, filePath).split(path.sep).join('/');
      const ext = getFileExtension(filePath);
      const language = getLanguageFromExtension(ext);
      const content = fs.readFileSync(filePath, 'utf-8');
      const contentHash = sha256Hex(content);

      const diagnostics: string[] = [];
      let extracted = extractJsTsLike('');
      let purpose = '';

      if (['ts', 'tsx', 'js', 'jsx', 'mjs', 'cjs'].includes(ext)) {
        extracted = extractJsTsLike(content);
        const tsr = tryParseWithTreeSitter(content, ext);
        if (tsr.ok) {
          diagnostics.push('tree-sitter:typescript:ok');
          extracted.functions = [
            ...new Set([...extracted.functions, ...tsr.extraFunctionNames]),
          ];
        } else {
          diagnostics.push('tree-sitter:unavailable');
        }
        purpose =
          firstCommentPurpose(content, language) ||
          `Source file (${extracted.exports.length} exports)`;
      } else if (ext === 'py') {
        extracted = extractPython(content);
        if (tryParsePythonTreeSitter(content)) {
          diagnostics.push('tree-sitter:python:ok');
        } else {
          diagnostics.push('tree-sitter:python:skipped');
        }
        purpose =
          firstCommentPurpose(content, language) ||
          `Python module (${extracted.functions.length} defs)`;
      } else if (ext === 'go') {
        extracted = extractGo(content);
        if (tryParseGoTreeSitter(content)) {
          diagnostics.push('tree-sitter:go:ok');
        } else {
          diagnostics.push('tree-sitter:go:skipped');
        }
        purpose = `Go package (${extracted.functions.length} funcs)`;
      } else if (ext === 'dart') {
        extracted = extractDart(content);
        diagnostics.push('regex:dart');
        purpose =
          firstCommentPurpose(content, language) ||
          `Dart source (${extracted.exports.length} types, ${extracted.functions.length} members)`;
      } else {
        extracted = extractJsTsLike(content);
        purpose = `Source (${language})`;
      }

      const dbAccess = detectDbAccess(content, language);
      const apiUsage = detectApiUsage(content, language);

      const importRecords = buildImportRecords(extracted);

      const context: FileContext = {
        filePath: relativeFilePath,
        language,
        purpose,
        exports: extracted.exports,
        imports: extracted.imports,
        functions: extracted.functions,
        dependencies: extracted.dependencies,
        dbAccess,
        apiUsage,
        summary: buildFileSummaryFromContext({
          language,
          exports: extracted.exports,
          functions: extracted.functions,
          dependencies: extracted.dependencies,
          apiUsage,
        }),
        diagnostics,
        importRecords,
        contentHash,
      };

      fileContexts.push(context);
    } catch (error) {
      const relativeFilePath = path.relative(baseDir, filePath).split(path.sep).join('/');
      const ext = getFileExtension(filePath);
      fileContexts.push({
        filePath: relativeFilePath,
        language: getLanguageFromExtension(ext),
        purpose: 'Failed to read file',
        exports: [],
        imports: [],
        functions: [],
        dependencies: [],
        dbAccess: [],
        apiUsage: [],
        summary: error instanceof Error ? error.message : String(error),
        diagnostics: ['parse:error'],
      });
    }
  }

  return fileContexts;
}
