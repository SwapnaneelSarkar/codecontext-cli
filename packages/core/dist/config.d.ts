/**
 * .codecontextrc.json shape (non-secret settings; API keys via env/flags only)
 */
export interface CodeContextConfig {
    version: number;
    include?: string[];
    exclude?: string[];
    llm?: {
        provider: 'anthropic' | 'openai' | 'ollama';
        model: string;
        temperature?: number;
        /** Max parallel LLM requests (keep low for local Ollama). */
        maxConcurrency?: number;
        /** Base URL without trailing slash (default http://localhost:11434). */
        ollamaUrl?: string;
        /** If true, failed Ollama responses fall back to regex-derived FileContext. */
        skipOnError?: boolean;
    };
    scan?: {
        followSymlinks?: boolean;
    };
}
export declare const DEFAULT_CONFIG: CodeContextConfig;
//# sourceMappingURL=config.d.ts.map