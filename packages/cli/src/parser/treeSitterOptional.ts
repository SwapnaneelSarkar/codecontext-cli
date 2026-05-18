/**
 * Optional Tree-sitter parse (native bindings). Validates grammars load; extraction uses regex.
 */
export function tryParseWithTreeSitter(
  source: string,
  ext: string
): { ok: boolean; extraFunctionNames: string[] } {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const Parser = require('tree-sitter');
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const Tsg = require('tree-sitter-typescript') as {
      typescript: unknown;
      tsx: unknown;
    };

    const isTsx = ext === 'tsx' || ext === 'jsx';
    const lang = isTsx ? Tsg.tsx : Tsg.typescript;
    const parser = new Parser();
    // tree-sitter Language type varies by version
    parser.setLanguage(lang as never);
    parser.parse(source);
    return { ok: true, extraFunctionNames: [] };
  } catch {
    return { ok: false, extraFunctionNames: [] };
  }
}

export function tryParsePythonTreeSitter(source: string): boolean {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const ParserMod = require('tree-sitter');
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const Py = require('tree-sitter-python') as { default: unknown };
    const parser = new ParserMod();
    parser.setLanguage(Py.default as never);
    parser.parse(source);
    return true;
  } catch {
    return false;
  }
}

export function tryParseGoTreeSitter(source: string): boolean {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const ParserMod = require('tree-sitter');
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const Go = require('tree-sitter-go') as { default: unknown };
    const parser = new ParserMod();
    parser.setLanguage(Go.default as never);
    parser.parse(source);
    return true;
  } catch {
    return false;
  }
}
