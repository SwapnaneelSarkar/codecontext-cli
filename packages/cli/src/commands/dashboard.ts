import { Command } from 'commander';
import chalk from 'chalk';
import { spawn } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';
import { projectDirOption, resolveProjectRoot } from '../utils/projectRoot';

function findWorkspaceRoot(start: string): string | null {
  let dir = path.resolve(start);
  while (dir !== path.dirname(dir)) {
    if (fs.existsSync(path.join(dir, 'pnpm-workspace.yaml'))) {
      return dir;
    }
    dir = path.dirname(dir);
  }
  return null;
}

function resolveDashboardDir(): string | null {
  const env = process.env.CODECONTEXT_DASHBOARD_PATH;
  if (env && fs.existsSync(env)) return env;

  const ws = findWorkspaceRoot(process.cwd());
  if (ws) {
    const d = path.join(ws, 'packages', 'dashboard');
    if (fs.existsSync(d)) return d;
  }

  const fromCli = path.join(__dirname, '..', '..', 'dashboard');
  if (fs.existsSync(fromCli)) return path.resolve(fromCli);

  return null;
}

function openUrl(url: string): void {
  try {
    const cmd =
      process.platform === 'darwin'
        ? `open "${url}"`
        : process.platform === 'win32'
          ? `start "" "${url}"`
          : `xdg-open "${url}"`;
    execSync(cmd, { stdio: 'ignore' });
  } catch {
    /* ignore */
  }
}

export const dashboardCommand = new Command('dashboard')
  .description('Start the Next.js dashboard for .ai-context')
  .option('-d, --dir <path>', 'Project root (overrides positional [path])')
  .option('--path <path>', 'Project root (same as --dir)')
  .option('-p, --port <port>', 'Port', '3000')
  .argument('[path]', 'Project directory to browse')
  .action((
    positionalPath: string | undefined,
    options: { dir?: string; path?: string; port: string }
  ) => {
    const projectRoot = resolveProjectRoot(positionalPath, projectDirOption(options));
    const dashboardDir = resolveDashboardDir();
    if (!dashboardDir) {
      console.error(
        chalk.red(
          'Could not find packages/dashboard. Set CODECONTEXT_DASHBOARD_PATH or run from the CodeContext monorepo.'
        )
      );
      process.exit(1);
    }

    const port = options.port || '3000';
    const url = `http://localhost:${port}`;

    const child = spawn(
      process.platform === 'win32' ? 'npx.cmd' : 'npx',
      ['next', 'dev', '-p', port],
      {
        cwd: dashboardDir,
        env: {
          ...process.env,
          CODECONTEXT_PROJECT_ROOT: projectRoot,
        },
        stdio: 'inherit',
        shell: process.platform === 'win32',
      }
    );

    console.log(
      chalk.cyan(`Dashboard starting… ${url}`),
      chalk.gray(`(CODECONTEXT_PROJECT_ROOT=${projectRoot})`)
    );
    setTimeout(() => openUrl(url), 2000);

    child.on('exit', (code) => process.exit(code ?? 0));
  });
