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
exports.writeContext = writeContext;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const core_1 = require("@codecontext/core");
const hash_1 = require("../utils/hash");
const cliVersion_1 = require("../utils/cliVersion");
const contextMarkdown_1 = require("./contextMarkdown");
function buildCursorRulesFragment(projectName, files) {
    const topImports = new Map();
    for (const f of files) {
        for (const i of f.imports) {
            const pkg = i.startsWith('.') ? 'relative' : i.split('/')[0];
            topImports.set(pkg, (topImports.get(pkg) ?? 0) + 1);
        }
    }
    const sorted = [...topImports.entries()]
        .sort((a, b) => b[1] - a[1])
        .slice(0, 12)
        .map(([k]) => k);
    return [
        `# CodeContext — ${projectName}`,
        '',
        'Before editing, read `.ai-context/index.json` for the full project index and file summaries.',
        '',
        'Frequent import roots:',
        ...sorted.map((s) => `- ${s}`),
        '',
    ].join('\n');
}
/**
 * Write generated context to .ai-context/ folder
 */
async function writeContext(fileContexts, projectGraph, baseDir, warnings = []) {
    const contextDir = path.join(baseDir, '.ai-context');
    const filesDir = path.join(contextDir, 'files');
    const modulesDir = path.join(contextDir, 'modules');
    const cacheDir = path.join(contextDir, 'cache');
    fs.mkdirSync(filesDir, { recursive: true });
    fs.mkdirSync(modulesDir, { recursive: true });
    fs.mkdirSync(cacheDir, { recursive: true });
    const manifest = {};
    for (const context of fileContexts) {
        const slug = (0, hash_1.fileJsonSlug)(context.filePath);
        const filePath = path.join(filesDir, `${slug}.json`);
        fs.writeFileSync(filePath, JSON.stringify(context, null, 2));
        manifest[context.filePath] = {
            contentHash: context.contentHash ?? (0, hash_1.sha256Hex)(context.summary),
            summaryHash: context.contentHash,
        };
    }
    const graphPath = path.join(contextDir, 'graph.json');
    fs.writeFileSync(graphPath, JSON.stringify(projectGraph, null, 2));
    const languages = Array.from(new Set(fileContexts.map((c) => c.language)));
    const modules = Array.from(new Set(fileContexts.flatMap((c) => c.dependencies)));
    const projectIndex = {
        schemaVersion: core_1.SCHEMA_VERSION,
        cliVersion: (0, cliVersion_1.getCliVersion)(),
        projectName: path.basename(baseDir),
        generatedAt: projectGraph.generatedAt,
        totalFiles: fileContexts.length,
        languages,
        modules,
        files: fileContexts,
        graph: projectGraph,
        warnings,
    };
    const indexPath = path.join(contextDir, 'index.json');
    fs.writeFileSync(indexPath, JSON.stringify(projectIndex, null, 2));
    const manifestPath = path.join(contextDir, 'manifest.json');
    fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
    fs.writeFileSync(path.join(contextDir, 'CONTEXT.md'), (0, contextMarkdown_1.buildContextMd)(projectIndex.projectName, fileContexts, projectGraph));
    fs.writeFileSync(path.join(contextDir, '.cursorrules.fragment'), buildCursorRulesFragment(projectIndex.projectName, fileContexts));
    fs.writeFileSync(path.join(contextDir, 'CLAUDE.md'), (0, contextMarkdown_1.buildClaudeMemoryMd)(projectIndex.projectName, fileContexts, projectGraph));
}
//# sourceMappingURL=contextWriter.js.map