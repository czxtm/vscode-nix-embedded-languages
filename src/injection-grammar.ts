import { LANGUAGES } from "./constants";

export type LanguageConfig = {
  scopeName: string;
  name?: string;
};

export type LanguagesMap = Record<string, string | LanguageConfig>;

/**
 * Maps a Nix function name pattern (restricted regex fragment allowed, e.g.
 * "writeShellScript|writeShellScriptBin") to a language identifier that
 * resolves via the `LanguagesMap`. When the function is called with a `''`
 * multiline string argument, the string content is highlighted as that
 * language automatically — no `# lang` marker needed.
 */
export type FunctionBindings = Record<string, string>;

export type VariableMarkerBindings = {
  prefix?: Record<string, string>;
  suffix?: Record<string, string>;
};

const DOUBLE_DASH_COMMENT_LANGUAGE_IDS = new Set(["lua", "sql"]);
const NIX_IDENTIFIER_CONTINUATION = "[A-Za-z0-9_'-]*";

const REGEX_FRAGMENT_ALLOWED_CHAR = /^[A-Za-z0-9_'|*+?-]$/;
const REGEX_FRAGMENT_ESCAPABLE_CHARS = new Set(["|", "*", "+", "?", "\\"]);

const isValidRegexFragment = (value: string) => {
  if (value.length === 0) {
    return false;
  }

  for (let index = 0; index < value.length; index += 1) {
    const char = value[index];
    if (char === "\\") {
      const next = value[index + 1];
      if (!next || !REGEX_FRAGMENT_ESCAPABLE_CHARS.has(next)) {
        return false;
      }
      index += 1;
      continue;
    }

    if (!REGEX_FRAGMENT_ALLOWED_CHAR.test(char)) {
      return false;
    }
  }

  try {
    new RegExp(`(?:${value})`);
  } catch {
    return false;
  }

  return true;
};

const regexFragment = (value: string) => `(?:${value})`;

const NIX_INTERPOLATION_PATTERN = {
  comment: "Match Nix interpolation inside embedded language",
  begin: "(?<!'')\\$\\{",
  beginCaptures: {
    "0": { name: "punctuation.section.embedded.begin.nix" },
  },
  end: "\\}",
  endCaptures: {
    "0": { name: "punctuation.section.embedded.end.nix" },
  },
  contentName: "meta.embedded.expression.nix",
  patterns: [{ include: "source.nix" }],
};

/**
 * TextMate injection grammar for embedded languages inside Nix multi-line strings.
 *
 * Supports three patterns:
 *
 * 1. Short form INSIDE string: `# lang`
 *    exec = ''
 *      # shell
 *      echo "hello"
 *    '';
 *
 * 2. Explicit form INSIDE string: `// syntax: lang` or `# syntax: lang`
 *    code = ''
 *      // syntax: js
 *      console.log("hi");
 *    '';
 *
 * 3. Comment BEFORE the string (for languages without comments like JSON):
 *    # syntax: json
 *    data = ''
 *      { "key": "value" }
 *    '';
 *
 * 4. Tree-sitter compatible block comment BEFORE the string.
 */
export class InjectionGrammar {
  private readonly languages: LanguagesMap;
  private readonly functionBindings: FunctionBindings;
  private readonly variableMarkerBindings: VariableMarkerBindings;

  constructor(
    languages: LanguagesMap = LANGUAGES,
    functionBindings: FunctionBindings = {},
    variableMarkerBindings: VariableMarkerBindings = {},
  ) {
    this.languages = languages;
    this.functionBindings = functionBindings;
    this.variableMarkerBindings = variableMarkerBindings;
  }

  /**
   * Grammar for patterns INSIDE strings (injected into string.quoted.other)
   */
  public toJSON() {
    return {
      scopeName: "source.nix.injection",
      injectionSelector: "L:source.nix string.quoted.other",
      patterns: this.getInsideStringPatterns(),
      repository: {},
    };
  }

  /**
   * Grammar for patterns BEFORE strings (injected into source.nix)
   */
  public toBeforeStringJSON() {
    return {
      scopeName: "source.nix.before-string.injection",
      injectionSelector: "L:source.nix -string",
      patterns: [
        ...this.getFunctionCallPatterns(),
        ...this.getVariableMarkerPatterns(),
        ...this.getBeforeStringPatterns(),
      ],
      repository: {},
    };
  }

  /**
   * Patterns for `pkgs.writeShellScript`-style calls: when a bound function
   * name and any same-line arguments are followed by a `''` string, highlight
   * the string content as the bound language without requiring a `# lang` marker.
   */
  private getFunctionCallPatterns() {
    return Object.entries(this.functionBindings).flatMap(
      ([funcPattern, langId]) => {
        const resolved = this.resolveLanguage(langId);
        if (!resolved || !isValidRegexFragment(funcPattern)) {
          return [];
        }
        const { scopeName, primaryId } = resolved;
        const funcRegex = regexFragment(funcPattern);
        return [
          {
            comment: `Match ${funcPattern} call before a '' string`,
            begin: `\\b(${funcRegex})\\b([^\\n]*?)('')`,
            beginCaptures: {
              "1": {
                name: "support.function.nix meta.embedded.hint.nix",
              },
              "3": {
                name: "string.quoted.other.nix punctuation.definition.string.begin.nix",
              },
            },
            end: "^\\s*''(?!')",
            endCaptures: {
              "0": {
                name: "string.quoted.other.nix punctuation.definition.string.end.nix",
              },
            },
            contentName: `meta.embedded.block.${primaryId} string.quoted.other.nix`,
            patterns: [NIX_INTERPOLATION_PATTERN, { include: scopeName }],
          },
        ];
      },
    );
  }

  /**
   * Patterns for variable names that imply an embedded language, e.g.
   * `fooScript = ''` when configured with suffix `{ "Script": "shell" }`.
   */
  private getVariableMarkerPatterns() {
    const entries = [
      ...Object.entries(this.variableMarkerBindings.prefix ?? {}).map(
        ([marker, langId]) => ({ marker, langId, position: "prefix" as const }),
      ),
      ...Object.entries(this.variableMarkerBindings.suffix ?? {}).map(
        ([marker, langId]) => ({ marker, langId, position: "suffix" as const }),
      ),
    ];

    return entries.flatMap(({ marker, langId, position }) => {
      const resolved = this.resolveLanguage(langId);
      if (!resolved || !isValidRegexFragment(marker)) {
        return [];
      }

      const { scopeName, primaryId } = resolved;
      const markerRegex = regexFragment(marker);
      const variableRegex =
        position === "prefix"
          ? `${markerRegex}${NIX_IDENTIFIER_CONTINUATION}`
          : `${NIX_IDENTIFIER_CONTINUATION}${markerRegex}`;

      return [
        {
          comment: `Match variable ${position} ${marker} before a '' string`,
          begin: `\\b(${variableRegex})\\b([^\\n]*?)('')`,
          beginCaptures: {
            "1": {
              name: "variable.other.assignment.nix meta.embedded.hint.nix",
            },
            "3": {
              name: "string.quoted.other.nix punctuation.definition.string.begin.nix",
            },
          },
          end: "^\\s*''(?!')",
          endCaptures: {
            "0": {
              name: "string.quoted.other.nix punctuation.definition.string.end.nix",
            },
          },
          contentName: `meta.embedded.block.${primaryId} string.quoted.other.nix`,
          patterns: [NIX_INTERPOLATION_PATTERN, { include: scopeName }],
        },
      ];
    });
  }

  /**
   * Resolve a language identifier (e.g. "shell") to its scope name and
   * primary id by searching the languages map for a key whose alias list
   * contains the identifier.
   */
  private resolveLanguage(
    idOrAlias: string,
  ): { scopeName: string; primaryId: string } | null {
    for (const [key, config] of Object.entries(this.languages)) {
      if (!isValidRegexFragment(key)) {
        continue;
      }

      const aliases = key.split("|");
      if (aliases.includes(idOrAlias)) {
        const scopeName =
          typeof config === "string" ? config : config.scopeName;
        return { scopeName, primaryId: aliases[0] };
      }
    }
    return null;
  }

  /**
   * Patterns for `# syntax: lang` comment BEFORE the string.
   * Must be at source.nix level to see comments outside strings.
   */
  private getBeforeStringPatterns() {
    const entries = Object.entries(this.languages);

    return entries.flatMap(([id, config]) => {
      if (!isValidRegexFragment(id)) {
        return [];
      }

      const scopeName = typeof config === "string" ? config : config.scopeName;
      const idPattern = regexFragment(id);
      const primaryId = id.split("|")[0];

      return [
        this.createBeforeStringPattern({
          comment: `Match # syntax: ${primaryId} before a '' string`,
          begin: `(#\\s*syntax:\\s*${idPattern}\\s*)$`,
          captureName: "comment.line.number-sign.nix meta.embedded.hint.nix",
          primaryId,
          scopeName,
        }),
        this.createBeforeStringPattern({
          comment: `Match /* ${primaryId} */ before a '' string`,
          begin: `(/\\*\\s*${idPattern}\\s*\\*/\\s*)`,
          captureName: "comment.block.nix meta.embedded.hint.nix",
          primaryId,
          scopeName,
        }),
      ];
    });
  }

  private createBeforeStringPattern({
    comment,
    begin,
    captureName,
    primaryId,
    scopeName,
  }: {
    comment: string;
    begin: string;
    captureName: string;
    primaryId: string;
    scopeName: string;
  }) {
    return {
      comment,
      begin,
      beginCaptures: {
        "1": { name: captureName },
      },
      end: "^\\s*''(?!')",
      endCaptures: {
        "0": {
          name: "string.quoted.other.nix punctuation.definition.string.end.nix",
        },
      },
      patterns: [
        {
          comment: "Match the multiline string start and inject language",
          begin: "''",
          beginCaptures: {
            "0": {
              name: "string.quoted.other.nix punctuation.definition.string.begin.nix",
            },
          },
          end: "(?=^\\s*''(?!'))",
          contentName: `meta.embedded.block.${primaryId} string.quoted.other.nix`,
          patterns: [NIX_INTERPOLATION_PATTERN, { include: scopeName }],
        },
      ],
    };
  }

  /**
   * Patterns for comments INSIDE the string.
   * Supports multiple formats:
   * - `# lang` (short form)
   * - `# syntax: lang` (explicit form with # comment)
   * - `// syntax: lang` (explicit form with // comment)
   * - `-- syntax: lang` (explicit form with -- comment)
   */
  private getInsideStringPatterns() {
    const entries = Object.entries(this.languages);
    const patterns: unknown[] = [];

    entries.forEach(([id, config]) => {
      if (!isValidRegexFragment(id)) {
        return;
      }

      const scopeName = typeof config === "string" ? config : config.scopeName;
      const idPattern = regexFragment(id);
      const primaryId = id.split("|")[0];
      const aliases = id.split("|");

      // # lang (short form - backward compatible)
      patterns.push({
        comment: `Match # ${primaryId} inside multiline string`,
        begin: `^\\s*#\\s*${idPattern}\\s*$`,
        beginCaptures: {
          "0": { name: "comment.line.number-sign meta.embedded.hint" },
        },
        while: "^(?!\\s*''(?!'))",
        contentName: `meta.embedded.block.${primaryId}`,
        patterns: [NIX_INTERPOLATION_PATTERN, { include: scopeName }],
      });

      // # syntax: lang (explicit shell-style comment)
      patterns.push({
        comment: `Match # syntax: ${primaryId} inside multiline string`,
        begin: `^\\s*#\\s*syntax:\\s*${idPattern}\\s*$`,
        beginCaptures: {
          "0": { name: "comment.line.number-sign meta.embedded.hint" },
        },
        while: "^(?!\\s*''(?!'))",
        contentName: `meta.embedded.block.${primaryId}`,
        patterns: [NIX_INTERPOLATION_PATTERN, { include: scopeName }],
      });

      // // syntax: lang (C-style comment)
      patterns.push({
        comment: `Match // syntax: ${primaryId} inside multiline string`,
        begin: `^\\s*//\\s*syntax:\\s*${idPattern}\\s*$`,
        beginCaptures: {
          "0": { name: "comment.line.double-slash meta.embedded.hint" },
        },
        while: "^(?!\\s*''(?!'))",
        contentName: `meta.embedded.block.${primaryId}`,
        patterns: [NIX_INTERPOLATION_PATTERN, { include: scopeName }],
      });

      if (
        aliases.some((alias) => DOUBLE_DASH_COMMENT_LANGUAGE_IDS.has(alias))
      ) {
        // -- syntax: lang (Lua/SQL-style comment)
        patterns.push({
          comment: `Match -- syntax: ${primaryId} inside multiline string`,
          begin: `^\\s*--\\s*syntax:\\s*${idPattern}\\s*$`,
          beginCaptures: {
            "0": { name: "comment.line.double-dash meta.embedded.hint" },
          },
          while: "^(?!\\s*''(?!'))",
          contentName: `meta.embedded.block.${primaryId}`,
          patterns: [NIX_INTERPOLATION_PATTERN, { include: scopeName }],
        });
      }
    });

    return patterns;
  }
}
