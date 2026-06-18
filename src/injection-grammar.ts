import { LANGUAGES } from "./constants";

export type LanguageConfig = {
  scopeName: string;
  name?: string;
};

export type LanguagesMap = Record<string, string | LanguageConfig>;

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

  constructor(languages: LanguagesMap = LANGUAGES) {
    this.languages = languages;
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
      patterns: this.getBeforeStringPatterns(),
      repository: {},
    };
  }

  /**
   * Patterns for `# syntax: lang` comment BEFORE the string.
   * Must be at source.nix level to see comments outside strings.
   */
  private getBeforeStringPatterns() {
    const entries = Object.entries(this.languages);

    return entries.flatMap(([id, config]) => {
      const scopeName = typeof config === "string" ? config : config.scopeName;
      const idPattern = id.includes("|") ? `(?:${id})` : id;
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
          patterns: [{ include: scopeName }],
        },
        { include: "source.nix" },
      ],
    };
  }

  /**
   * Patterns for comments INSIDE the string.
   * Supports multiple formats:
   * - `# lang` (short form)
   * - `# syntax: lang` (explicit form with # comment)
   * - `// syntax: lang` (explicit form with // comment)
   */
  private getInsideStringPatterns() {
    const entries = Object.entries(this.languages);
    const patterns: unknown[] = [];

    entries.forEach(([id, config]) => {
      const scopeName = typeof config === "string" ? config : config.scopeName;
      const idPattern = id.includes("|") ? `(?:${id})` : id;
      const primaryId = id.split("|")[0];

      // # lang (short form - backward compatible)
      patterns.push({
        comment: `Match # ${primaryId} inside multiline string`,
        begin: `^\\s*#\\s*${idPattern}\\s*$`,
        beginCaptures: {
          "0": { name: "comment.line.number-sign meta.embedded.hint" },
        },
        while: "^(?!\\s*''(?!'))",
        contentName: `meta.embedded.block.${primaryId}`,
        patterns: [{ include: scopeName }],
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
        patterns: [{ include: scopeName }],
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
        patterns: [{ include: scopeName }],
      });
    });

    return patterns;
  }
}
