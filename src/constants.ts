import packageJson from "@package";

export const SUB_INCLUDE_CONFIG = "include";
export const SUB_FUNCTION_BINDINGS_CONFIG = "functionBindings";
export const SUB_ENABLE_FUNCTION_BINDINGS_CONFIG = "enableFunctionBindings";
export const INCLUDE_CONFIG = `${packageJson.name}.${SUB_INCLUDE_CONFIG}`;
export const FUNCTION_BINDINGS_CONFIG = `${packageJson.name}.${SUB_FUNCTION_BINDINGS_CONFIG}`;
export const ENABLE_FUNCTION_BINDINGS_CONFIG = `${packageJson.name}.${SUB_ENABLE_FUNCTION_BINDINGS_CONFIG}`;
export const VERSION_STATE = "version";

/**
 * Built-in language mappings.
 * Keys can use regex alternation (e.g., "shell|bash|sh") for aliases.
 * Values are either a scope name string or an object with scopeName.
 */
export const LANGUAGES: Record<
  string,
  string | { scopeName: string; name?: string }
> = {
  "shell|bash|sh": { name: "shellscript", scopeName: "source.shell" },
  "python|py": { name: "python", scopeName: "source.python" },
  "javascript|js": { name: "javascript", scopeName: "source.js" },
  "typescript|ts": { name: "typescript", scopeName: "source.ts" },
  json: "source.json",
  yaml: "source.yaml",
  sql: "source.sql",
  lua: "source.lua",
  ruby: "source.ruby",
  rust: "source.rust",
  go: "source.go",
  html: "text.html.derivative",
  css: "source.css",
  nix: "source.nix",
};

/**
 * Built-in function bindings: maps a Nix function name pattern (regex
 * alternation allowed) to a language identifier that exists in `LANGUAGES`
 * (or the user's `include` config). When the function is called with a `''`
 * multiline string argument on the same line, the string content is
 * automatically highlighted as that language — no `# lang` marker needed.
 *
 * Covers the common nixpkgs trivial-builders that take a positional `''`
 * script string:
 *   - writeShellScript / writeShellScriptBin  (bash)
 *   - writeScript / writeScriptBin            (legacy, bash)
 *   - writeBash / writeBashBin                (bash)
 *   - writeDash                                (dash, sh-compatible)
 */
export const FUNCTION_BINDINGS: Record<string, string> = {
  "writeShellScript|writeShellScriptBin": "shell",
  "writeScript|writeScriptBin": "shell",
  "writeBash|writeBashBin": "shell",
  writeDash: "shell",
};
