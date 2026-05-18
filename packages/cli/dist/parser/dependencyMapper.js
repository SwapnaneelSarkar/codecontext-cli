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
exports.mapDependencies = mapDependencies;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const tsconfig_paths_1 = require("tsconfig-paths");
function probeFile(resolvedWithoutExt) {
    const candidates = [
        resolvedWithoutExt,
        `${resolvedWithoutExt}.ts`,
        `${resolvedWithoutExt}.tsx`,
        `${resolvedWithoutExt}.js`,
        `${resolvedWithoutExt}.jsx`,
        `${resolvedWithoutExt}.mjs`,
        `${resolvedWithoutExt}.cjs`,
        path.join(resolvedWithoutExt, 'index.ts'),
        path.join(resolvedWithoutExt, 'index.tsx'),
        path.join(resolvedWithoutExt, 'index.js'),
    ];
    for (const c of candidates) {
        try {
            const st = fs.statSync(c);
            if (st.isFile())
                return path.normalize(c);
        }
        catch {
            /* missing */
        }
    }
    return null;
}
function resolveRelative(fromAbsFile, spec, projectRoot) {
    const dir = path.dirname(fromAbsFile);
    const joined = path.resolve(dir, spec);
    const hit = probeFile(joined);
    if (!hit)
        return null;
    const rel = path.relative(projectRoot, hit);
    if (rel.startsWith('..'))
        return null;
    return rel.split(path.sep).join('/');
}
function isBareOrPackage(spec) {
    return !spec.startsWith('.') && !path.isAbsolute(spec);
}
/**
 * Build resolved dependency info per file (project-relative paths as keys).
 */
function mapDependencies(fileContexts, projectRoot) {
    const root = path.resolve(projectRoot);
    let matchPath;
    try {
        const loaded = (0, tsconfig_paths_1.loadConfig)(root);
        if (loaded.resultType === 'success') {
            matchPath = (0, tsconfig_paths_1.createMatchPath)(loaded.absoluteBaseUrl, loaded.paths ?? {});
        }
    }
    catch {
        matchPath = undefined;
    }
    const normalizedPaths = new Set(fileContexts.map((f) => f.filePath.split(path.sep).join('/')));
    const map = new Map();
    for (const ctx of fileContexts) {
        const fromAbs = path.join(root, ctx.filePath);
        const records = [];
        const resolved = [];
        const externals = [];
        const sourceRecords = ctx.importRecords && ctx.importRecords.length > 0
            ? ctx.importRecords
            : ctx.imports.map((s) => ({
                specifier: s,
                resolvedPath: null,
                isDynamic: false,
            }));
        for (const rec of sourceRecords) {
            const spec = rec.specifier;
            if (isBareOrPackage(spec)) {
                let matchedRel = null;
                if (matchPath) {
                    try {
                        const tryMatch = matchPath(spec, undefined, undefined, [
                            '.ts',
                            '.tsx',
                            '.js',
                            '.jsx',
                            '.json',
                        ]);
                        if (tryMatch) {
                            const rel = path.relative(root, tryMatch).split(path.sep).join('/');
                            if (!rel.startsWith('..')) {
                                matchedRel = rel;
                            }
                        }
                    }
                    catch {
                        /* ignore */
                    }
                }
                if (matchedRel && normalizedPaths.has(matchedRel)) {
                    resolved.push(matchedRel);
                    records.push({
                        specifier: spec,
                        resolvedPath: matchedRel,
                        isDynamic: rec.isDynamic,
                    });
                }
                else {
                    const pkg = spec.startsWith('@')
                        ? spec.split('/').slice(0, 2).join('/')
                        : spec.split('/')[0];
                    if (pkg)
                        externals.push(pkg);
                    records.push({
                        specifier: spec,
                        resolvedPath: null,
                        isDynamic: rec.isDynamic,
                    });
                }
                continue;
            }
            const rel = resolveRelative(fromAbs, spec, root);
            if (rel && normalizedPaths.has(rel)) {
                resolved.push(rel);
                records.push({
                    specifier: spec,
                    resolvedPath: rel,
                    isDynamic: rec.isDynamic,
                });
            }
            else {
                records.push({
                    specifier: spec,
                    resolvedPath: null,
                    isDynamic: rec.isDynamic,
                });
            }
        }
        map.set(ctx.filePath.split(path.sep).join('/'), {
            resolved: [...new Set(resolved)],
            externals: [...new Set(externals)],
            importRecords: records,
        });
    }
    return map;
}
//# sourceMappingURL=dependencyMapper.js.map