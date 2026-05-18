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
exports.dashboardCommand = void 0;
const commander_1 = require("commander");
const chalk_1 = __importDefault(require("chalk"));
const child_process_1 = require("child_process");
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const child_process_2 = require("child_process");
const projectRoot_1 = require("../utils/projectRoot");
function findWorkspaceRoot(start) {
    let dir = path.resolve(start);
    while (dir !== path.dirname(dir)) {
        if (fs.existsSync(path.join(dir, 'pnpm-workspace.yaml'))) {
            return dir;
        }
        dir = path.dirname(dir);
    }
    return null;
}
function resolveDashboardDir() {
    const env = process.env.CODECONTEXT_DASHBOARD_PATH;
    if (env && fs.existsSync(env))
        return env;
    const ws = findWorkspaceRoot(process.cwd());
    if (ws) {
        const d = path.join(ws, 'packages', 'dashboard');
        if (fs.existsSync(d))
            return d;
    }
    const fromCli = path.join(__dirname, '..', '..', 'dashboard');
    if (fs.existsSync(fromCli))
        return path.resolve(fromCli);
    return null;
}
function openUrl(url) {
    try {
        const cmd = process.platform === 'darwin'
            ? `open "${url}"`
            : process.platform === 'win32'
                ? `start "" "${url}"`
                : `xdg-open "${url}"`;
        (0, child_process_2.execSync)(cmd, { stdio: 'ignore' });
    }
    catch {
        /* ignore */
    }
}
exports.dashboardCommand = new commander_1.Command('dashboard')
    .description('Start the Next.js dashboard for .ai-context')
    .option('-d, --dir <path>', 'Project root (overrides positional [path])')
    .option('--path <path>', 'Project root (same as --dir)')
    .option('-p, --port <port>', 'Port', '3000')
    .argument('[path]', 'Project directory to browse')
    .action((positionalPath, options) => {
    const projectRoot = (0, projectRoot_1.resolveProjectRoot)(positionalPath, (0, projectRoot_1.projectDirOption)(options));
    const dashboardDir = resolveDashboardDir();
    if (!dashboardDir) {
        console.error(chalk_1.default.red('Could not find packages/dashboard. Set CODECONTEXT_DASHBOARD_PATH or run from the CodeContext monorepo.'));
        process.exit(1);
    }
    const port = options.port || '3000';
    const url = `http://localhost:${port}`;
    const child = (0, child_process_1.spawn)(process.platform === 'win32' ? 'npx.cmd' : 'npx', ['next', 'dev', '-p', port], {
        cwd: dashboardDir,
        env: {
            ...process.env,
            CODECONTEXT_PROJECT_ROOT: projectRoot,
        },
        stdio: 'inherit',
        shell: process.platform === 'win32',
    });
    console.log(chalk_1.default.cyan(`Dashboard starting… ${url}`), chalk_1.default.gray(`(CODECONTEXT_PROJECT_ROOT=${projectRoot})`));
    setTimeout(() => openUrl(url), 2000);
    child.on('exit', (code) => process.exit(code ?? 0));
});
//# sourceMappingURL=dashboard.js.map