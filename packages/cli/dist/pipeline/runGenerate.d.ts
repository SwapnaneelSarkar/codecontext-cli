export interface RunGenerateOptions {
    targetDir: string;
    skipLlm?: boolean;
    dryRun?: boolean;
    yes?: boolean;
    maxFiles?: number;
    concurrency?: number;
    anthropicApiKey?: string;
    openaiApiKey?: string;
    /** Delete `.ai-context/cache/summaries.json` before running (fresh LLM). */
    clearCache?: boolean;
    /** Print LLM pipeline debug lines to stderr. */
    debugLlm?: boolean;
    onProgress?: (phase: string, detail?: {
        done?: number;
        total?: number;
        file?: string;
    }) => void;
}
export declare function runGenerate(opts: RunGenerateOptions): Promise<void>;
//# sourceMappingURL=runGenerate.d.ts.map