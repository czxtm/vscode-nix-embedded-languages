import { describe, expect, test } from "bun:test";
import { InjectionGrammar } from "../src/injection-grammar";

describe("Lua-style syntax comments", () => {
  test("generates an inside-string pattern for -- syntax: lua", () => {
    const grammar = new InjectionGrammar({ lua: "source.lua" }).toJSON();
    const pattern = grammar.patterns.find(
      ({ comment }) =>
        comment === "Match -- syntax: lua inside multiline string",
    );

    expect(pattern).toEqual({
      comment: "Match -- syntax: lua inside multiline string",
      begin: "^\\s*--\\s*syntax:\\s*lua\\s*$",
      beginCaptures: {
        "0": { name: "comment.line.double-dash meta.embedded.hint" },
      },
      while: "^(?!\\s*''(?!'))",
      contentName: "meta.embedded.block.lua",
      patterns: [{ include: "source.lua" }],
    });
  });
});
