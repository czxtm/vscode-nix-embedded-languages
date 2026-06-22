import { describe, expect, test } from "bun:test";
import { InjectionGrammar } from "../src/injection-grammar";
import { embeddedPatterns } from "./helpers";

describe("comment before multiline string", () => {
  test("keeps the outer pattern open past an assignment string opener", () => {
    const grammar = new InjectionGrammar({
      css: "source.css",
    }).toBeforeStringJSON();
    const pattern = grammar.patterns.find(
      ({ comment }) => comment === "Match # syntax: css before a '' string",
    );

    expect(pattern).toMatchObject({
      begin: "(#\\s*syntax:\\s*(?:css)\\s*)$",
      end: "^\\s*''(?!')",
      patterns: [
        {
          begin: "''",
          end: "(?=^\\s*''(?!'))",
          contentName: "meta.embedded.block.css string.quoted.other.nix",
          patterns: embeddedPatterns("source.css"),
        },
      ],
    });
  });
});
