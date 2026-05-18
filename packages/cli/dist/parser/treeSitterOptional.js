"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.tryParseWithTreeSitter = tryParseWithTreeSitter;
exports.tryParsePythonTreeSitter = tryParsePythonTreeSitter;
exports.tryParseGoTreeSitter = tryParseGoTreeSitter;
/**
 * Optional Tree-sitter parse (native bindings). Validates grammars load; extraction uses regex.
 */
function tryParseWithTreeSitter(source, ext) {
    try {
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const Parser = require('tree-sitter');
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const Tsg = require('tree-sitter-typescript');
        const isTsx = ext === 'tsx' || ext === 'jsx';
        const lang = isTsx ? Tsg.tsx : Tsg.typescript;
        const parser = new Parser();
        // tree-sitter Language type varies by version
        parser.setLanguage(lang);
        parser.parse(source);
        return { ok: true, extraFunctionNames: [] };
    }
    catch {
        return { ok: false, extraFunctionNames: [] };
    }
}
function tryParsePythonTreeSitter(source) {
    try {
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const ParserMod = require('tree-sitter');
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const Py = require('tree-sitter-python');
        const parser = new ParserMod();
        parser.setLanguage(Py.default);
        parser.parse(source);
        return true;
    }
    catch {
        return false;
    }
}
function tryParseGoTreeSitter(source) {
    try {
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const ParserMod = require('tree-sitter');
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const Go = require('tree-sitter-go');
        const parser = new ParserMod();
        parser.setLanguage(Go.default);
        parser.parse(source);
        return true;
    }
    catch {
        return false;
    }
}
//# sourceMappingURL=treeSitterOptional.js.map