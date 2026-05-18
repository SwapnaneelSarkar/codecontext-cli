import * as path from 'path';

/** Options that can set project root (`--path` wins over `--dir` if both are set). */
export function projectDirOption(options: {
  dir?: string;
  path?: string;
}): string | undefined {
  return options.path ?? options.dir;
}

/**
 * Resolve project root: explicit --path/--dir wins, then positional path, then cwd.
 */
export function resolveProjectRoot(
  positionalPath: string | undefined,
  dirOption: string | undefined
): string {
  return path.resolve(dirOption ?? positionalPath ?? process.cwd());
}
