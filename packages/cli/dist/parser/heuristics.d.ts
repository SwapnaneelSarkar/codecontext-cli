/**
 * DB / API hints from source text (complements AST where available)
 */
export declare function detectDbAccess(source: string, lang: string): string[];
export declare function detectApiUsage(source: string, lang: string): string[];
/** Flutter/Dart framework signals merged into FileContext.apiUsage for Dart files. */
export declare function detectDartFlutterContext(source: string): string[];
//# sourceMappingURL=heuristics.d.ts.map