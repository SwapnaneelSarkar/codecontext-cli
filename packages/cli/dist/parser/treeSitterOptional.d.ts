/**
 * Optional Tree-sitter parse (native bindings). Validates grammars load; extraction uses regex.
 */
export declare function tryParseWithTreeSitter(source: string, ext: string): {
    ok: boolean;
    extraFunctionNames: string[];
};
export declare function tryParsePythonTreeSitter(source: string): boolean;
export declare function tryParseGoTreeSitter(source: string): boolean;
//# sourceMappingURL=treeSitterOptional.d.ts.map