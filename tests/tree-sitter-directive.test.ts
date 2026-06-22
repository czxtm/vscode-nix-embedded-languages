import { describe, expect, test } from "bun:test";
import { InjectionGrammar } from "../src/injection-grammar";
import { embeddedPatterns } from "./helpers";

describe("tree-sitter compatible block comment directives", () => {
  test("generates a before-string pattern for /* shell */", () => {
    const grammar = new InjectionGrammar({
      "shell|bash|sh": { name: "shellscript", scopeName: "source.shell" },
    }).toBeforeStringJSON();
    const pattern = grammar.patterns.find(
      ({ comment }) => comment === "Match /* shell */ before a '' string",
    );

    expect(pattern).toMatchObject({
      begin: "(/\\*\\s*(?:shell|bash|sh)\\s*\\*/\\s*)",
      beginCaptures: {
        "1": { name: "comment.block.nix meta.embedded.hint.nix" },
      },
      end: "^\\s*''(?!')",
      patterns: [
        {
          begin: "''",
          end: "(?=^\\s*''(?!'))",
          contentName: "meta.embedded.block.shell string.quoted.other.nix",
          patterns: embeddedPatterns("source.shell"),
        },
      ],
    });
  });
});
