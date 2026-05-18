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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.shouldHardExclude = shouldHardExclude;
exports.scanFiles = scanFiles;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const ignore_1 = __importDefault(require("ignore"));
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
/**
 * Paths always skipped, even if .gitignore negates them (Pods, build outputs, etc.).
 */
function shouldHardExclude(relativePosixPath, baseName) {
    const norm = relativePosixPath.replace(/\\/g, '/');
    const segments = norm.split('/').filter(Boolean);
    const segmentBlocklist = new Set([
        'node_modules',
        '.git',
        '.ai-context',
        '.dart_tool',
    ]);
    for (const seg of segments) {
        if (segmentBlocklist.has(seg))
            return true;
    }
    if (/(^|\/)ios\/Pods(\/|$)/.test(norm))
        return true;
    if (/(^|\/)ios\/\.symlinks(\/|$)/.test(norm))
        return true;
    if (/(^|\/)android\/\.gradle(\/|$)/.test(norm))
        return true;
    if (norm === 'android/build' || norm.startsWith('android/build/'))
        return true;
    if (norm === 'build' || norm.startsWith('build/'))
        return true;
    if (baseName === '.flutter-plugins' ||
        baseName === '.flutter-plugins-dependencies' ||
        baseName === 'pubspec.lock') {
        return true;
    }
    if (baseName.endsWith('.g.dart') || baseName.endsWith('.freezed.dart')) {
        return true;
    }
    return false;
}
function loadGitignoreMatchers(targetDir) {
    const ig = (0, ignore_1.default)();
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
function isSourceFile(filePath) {
    const ext = path.extname(filePath).replace(/^\./, '').toLowerCase();
    return SOURCE_EXTENSIONS.has(ext);
}
/**
 * Recursively scan directory and return source file paths (absolute).
 */
async function scanFiles(targetDir, options = {}) {
    const files = [];
    const ig = loadGitignoreMatchers(targetDir);
    const followSymlinks = options.followSymlinks === true;
    function walkDir(dir) {
        let entries;
        try {
            entries = fs.readdirSync(dir, { withFileTypes: true });
        }
        catch {
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
            if (!entry.isFile())
                continue;
            if (ig.ignores(relativePath))
                continue;
            if (!isSourceFile(fullPath))
                continue;
            files.push(fullPath);
        }
    }
    walkDir(targetDir);
    return files;
}
//# sourceMappingURL=fileScanner.js.map