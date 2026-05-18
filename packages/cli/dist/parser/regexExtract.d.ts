/**
 * Portable extraction when Tree-sitter is unavailable or as supplement.
 */
export interface ImportDetail {
    specifier: string;
    isDynamic: boolean;
}
export interface Extracted {
    imports: string[];
    importDetails: ImportDetail[];
    exports: string[];
    functions: string[];
    dependencies: string[];
}
export declare function extractDart(source: string): Extracted;
export declare function extractJsTsLike(source: string): Extracted;
export declare function extractPython(source: string): Extracted;
export declare function extractGo(source: string): Extracted;
//# sourceMappingURL=regexExtract.d.ts.map