import type { FileContext } from '../types/index';
/** Ranked search hit */
export interface ScoredFile {
    filePath: string;
    score: number;
    summary: string;
    snippet: string;
}
/**
 * Lightweight BM25 ranking over file contexts (same idea as CLI query)
 */
export declare function rankFilesByQuery(query: string, files: FileContext[], topK?: number): ScoredFile[];
//# sourceMappingURL=bm25.d.ts.map