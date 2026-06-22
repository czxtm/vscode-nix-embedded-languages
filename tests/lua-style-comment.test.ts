import { describe, expect, test } from "bun:test";
import { InjectionGrammar } from "../src/injection-grammar";
import { embeddedPatterns } from "./helpers";

describe("Lua-style syntax comments", () => {
  test("generates -- syntax patterns only for languages that use -- comments", () => {
    const grammar = new InjectionGrammar({
      lua: "source.lua",
      sql: "source.sql",
      shell: "source.shell",
      javascript: "source.js",
    }).toJSON();

    expect(findPattern(grammar, "lua")).toEqual({
      comment: "Match -- syntax: lua inside multiline string",
      begin: "^\\s*--\\s*syntax:\\s*(?:lua)\\s*$",
      beginCaptures: {
        "0": { name: "comment.line.double-dash meta.embedded.hint" },
      },
      while: "^(?!\\s*''(?!'))",
      contentName: "meta.embedded.block.lua",
      patterns: embeddedPatterns("source.lua"),
    });
    expect(findPattern(grammar, "sql")).toMatchObject({
      begin: "^\\s*--\\s*syntax:\\s*(?:sql)\\s*$",
      patterns: embeddedPatterns("source.sql"),
    });
    expect(findPattern(grammar, "shell")).toBeUndefined();
    expect(findPattern(grammar, "javascript")).toBeUndefined();
  });
});

const findPattern = (
  grammar: ReturnType<InjectionGrammar["toJSON"]>,
  language: string,
) =>
  grammar.patterns.find(
    ({ comment }) =>
      comment === `Match -- syntax: ${language} inside multiline string`,
  );
