export interface ScanOptions {
    followSymlinks?: boolean;
}
/**
 * Paths always skipped, even if .gitignore negates them (Pods, build outputs, etc.).
 */
export declare function shouldHardExclude(relativePosixPath: string, baseName: string): boolean;
/**
 * Recursively scan directory and return source file paths (absolute).
 */
export declare function scanFiles(targetDir: string, options?: ScanOptions): Promise<string[]>;
//# sourceMappingURL=fileScanner.d.ts.map