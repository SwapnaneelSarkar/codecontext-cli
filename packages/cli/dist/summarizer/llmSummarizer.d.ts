import type { CodeContextConfig, FileContext } from '@codecontext/core';
export declare const PARSER_VERSION = "1";
export interface SummarizeOptions {
    config: CodeContextConfig;
    projectRoot: string;
    dryRun?: boolean;
    skipLlm?: boolean;
    yes?: boolean;
    anthropicApiKey?: string;
    openaiApiKey?: string;
    maxFiles?: number;
    /** Log Ollama request/response details to stderr. */
    debugLlm?: boolean;
    /** Called after each file is summarized (done is 1-based count finished). */
    onProgress?: (done: number, total: number, filePath: string) => void;
}
export declare function mergeDiagnostics(fc: FileContext, ...tags: string[]): FileContext;
export declare function clearSummaryCache(projectRoot: string): void;
/** GET base URL to see if Ollama is listening. */
export declare function checkOllamaReachable(baseUrl: string): Promise<boolean>;
export declare function extractOllamaResponseText(data: Record<string, unknown>): string;
/** Strip markdown fences and trim; then JSON.parse. */
export declare function stripJsonFences(text: string): string;
export declare function summarizeFileContext(fc: FileContext, content: string, opts: SummarizeOptions): Promise<FileContext>;
/** Rough USD estimate (order-of-magnitude; update with current pricing). */
export declare function estimateCostUsd(fileCount: number, avgCharsPerFile?: number): {
    low: number;
    high: number;
    approxTokens: number;
};
export declare function summarizeFiles(contexts: FileContext[], readContent: (rel: string) => string, opts: SummarizeOptions): Promise<FileContext[]>;
export declare function testOllamaOnFirstFile(projectRoot: string, config: CodeContextConfig): Promise<void>;
//# sourceMappingURL=llmSummarizer.d.ts.map