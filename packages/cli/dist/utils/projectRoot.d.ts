/** Options that can set project root (`--path` wins over `--dir` if both are set). */
export declare function projectDirOption(options: {
    dir?: string;
    path?: string;
}): string | undefined;
/**
 * Resolve project root: explicit --path/--dir wins, then positional path, then cwd.
 */
export declare function resolveProjectRoot(positionalPath: string | undefined, dirOption: string | undefined): string;
//# sourceMappingURL=projectRoot.d.ts.map