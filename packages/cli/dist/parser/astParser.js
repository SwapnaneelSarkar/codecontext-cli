"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseFilesAST = parseFilesAST;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const core_1 = require("@codecontext/core");
const hash_1 = require("../utils/hash");
const heuristics_1 = require("./heuristics");
const regexExtract_1 = require("./regexExtract");
const treeSitterOptional_1 = require("./treeSitterOptional");
const contextMarkdown_1 = require("../writer/contextMarkdown");
function firstCommentPurpose(source, language) {
    const block = /^\s*\/\*\*?([\s\S]*?)\*\//m.exec(source);
    if (block) {
        return block[1].replace(/^\s*\*\s?/gm, ' ').trim().slice(0, 200);
    }
    if (language === 'Python') {
        const doc = /^\s*"""([\s\S]*?)"""/m.exec(source);
        if (doc)
            return doc[1].trim().slice(0, 200);
    }
    if (language === 'Dart') {
        const docLines = [];
        for (const line of source.split('\n')) {
            const dm = line.match(/^\s*\/\/\/\s?(.*)$/);
            if (dm)
                docLines.push(dm[1]);
            else if (docLines.length)
                break;
        }
        if (docLines.length) {
            return docLines.join(' ').trim().slice(0, 200);
        }
    }
    return '';
}
function buildImportRecords(extracted) {
    return extracted.importDetails.map((d) => ({
        specifier: d.specifier,
        resolvedPath: null,
        isDynamic: d.isDynamic,
    }));
}
async function parseFilesAST(files, baseDir) {
    const fileContexts = [];
    for (const filePath of files) {
        try {
            const relativeFilePath = path.relative(baseDir, filePath).split(path.sep).join('/');
            const ext = (0, core_1.getFileExtension)(filePath);
            const language = (0, core_1.getLanguageFromExtension)(ext);
            const content = fs.readFileSync(filePath, 'utf-8');
            const contentHash = (0, hash_1.sha256Hex)(content);
            const diagnostics = [];
            let extracted = (0, regexExtract_1.extractJsTsLike)('');
            let purpose = '';
            if (['ts', 'tsx', 'js', 'jsx', 'mjs', 'cjs'].includes(ext)) {
                extracted = (0, regexExtract_1.extractJsTsLike)(content);
                const tsr = (0, treeSitterOptional_1.tryParseWithTreeSitter)(content, ext);
                if (tsr.ok) {
                    diagnostics.push('tree-sitter:typescript:ok');
                    extracted.functions = [
                        ...new Set([...extracted.functions, ...tsr.extraFunctionNames]),
                    ];
                }
                else {
                    diagnostics.push('tree-sitter:unavailable');
                }
                purpose =
                    firstCommentPurpose(content, language) ||
                        `Source file (${extracted.exports.length} exports)`;
            }
            else if (ext === 'py') {
                extracted = (0, regexExtract_1.extractPython)(content);
                if ((0, treeSitterOptional_1.tryParsePythonTreeSitter)(content)) {
                    diagnostics.push('tree-sitter:python:ok');
                }
                else {
                    diagnostics.push('tree-sitter:python:skipped');
                }
                purpose =
                    firstCommentPurpose(content, language) ||
                        `Python module (${extracted.functions.length} defs)`;
            }
            else if (ext === 'go') {
                extracted = (0, regexExtract_1.extractGo)(content);
                if ((0, treeSitterOptional_1.tryParseGoTreeSitter)(content)) {
                    diagnostics.push('tree-sitter:go:ok');
                }
                else {
                    diagnostics.push('tree-sitter:go:skipped');
                }
                purpose = `Go package (${extracted.functions.length} funcs)`;
            }
            else if (ext === 'dart') {
                extracted = (0, regexExtract_1.extractDart)(content);
                diagnostics.push('regex:dart');
                purpose =
                    firstCommentPurpose(content, language) ||
                        `Dart source (${extracted.exports.length} types, ${extracted.functions.length} members)`;
            }
            else {
                extracted = (0, regexExtract_1.extractJsTsLike)(content);
                purpose = `Source (${language})`;
            }
            const dbAccess = (0, heuristics_1.detectDbAccess)(content, language);
            const apiUsage = (0, heuristics_1.detectApiUsage)(content, language);
            const importRecords = buildImportRecords(extracted);
            const context = {
                filePath: relativeFilePath,
                language,
                purpose,
                exports: extracted.exports,
                imports: extracted.imports,
                functions: extracted.functions,
                dependencies: extracted.dependencies,
                dbAccess,
                apiUsage,
                summary: (0, contextMarkdown_1.buildFileSummaryFromContext)({
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
        }
        catch (error) {
            const relativeFilePath = path.relative(baseDir, filePath).split(path.sep).join('/');
            const ext = (0, core_1.getFileExtension)(filePath);
            fileContexts.push({
                filePath: relativeFilePath,
                language: (0, core_1.getLanguageFromExtension)(ext),
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
//# sourceMappingURL=astParser.js.map