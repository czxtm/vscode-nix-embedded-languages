import { describe, expect, test } from "bun:test";
import { InjectionGrammar } from "../src/injection-grammar";

const findVariableMarkerPattern = (
  grammar: ReturnType<InjectionGrammar["toBeforeStringJSON"]>,
  marker: string,
  position: "prefix" | "suffix",
) =>
  grammar.patterns.find(
    ({ comment }) =>
      comment === `Match variable ${position} ${marker} before a '' string`,
  );

const patternBegin = (
  pattern: ReturnType<typeof findVariableMarkerPattern>,
) => {
  expect(pattern).toBeDefined();
  return new RegExp(pattern?.begin ?? "");
};

describe("variable marker bindings", () => {
  test("generates suffix marker patterns", () => {
    const grammar = new InjectionGrammar(
      { "shell|bash|sh": "source.shell" },
      {},
      { suffix: { Script: "shell" } },
    ).toBeforeStringJSON();

    const pattern = findVariableMarkerPattern(grammar, "Script", "suffix");
    expect(pattern).toMatchObject({
      begin: "\\b([A-Za-z0-9_'-]*(?:Script))\\b([^\\n]*?)('')",
      beginCaptures: {
        "1": { name: "variable.other.assignment.nix meta.embedded.hint.nix" },
        "3": {
          name: "string.quoted.other.nix punctuation.definition.string.begin.nix",
        },
      },
      contentName: "meta.embedded.block.shell string.quoted.other.nix",
      patterns: [{ include: "source.shell" }],
    });
  });

  test("generates prefix marker patterns", () => {
    const grammar = new InjectionGrammar(
      { python: "source.python" },
      {},
      { prefix: { py: "python" } },
    ).toBeforeStringJSON();

    const pattern = findVariableMarkerPattern(grammar, "py", "prefix");
    expect(pattern).toMatchObject({
      begin: "\\b((?:py)[A-Za-z0-9_'-]*)\\b([^\\n]*?)('')",
      contentName: "meta.embedded.block.python string.quoted.other.nix",
      patterns: [{ include: "source.python" }],
    });
  });

  test("suffix regex matches only variables ending with the marker", () => {
    const grammar = new InjectionGrammar(
      { "shell|bash|sh": "source.shell" },
      {},
      { suffix: { Script: "shell" } },
    ).toBeforeStringJSON();

    const regex = patternBegin(
      findVariableMarkerPattern(grammar, "Script", "suffix"),
    );

    expect(regex.exec("fooScript = ''")?.slice(1, 4)).toEqual([
      "fooScript",
      " = ",
      "''",
    ]);
    expect(regex.exec("fooScript 1 ''")?.slice(1, 4)).toEqual([
      "fooScript",
      " 1 ",
      "''",
    ]);
    expect(regex.test("fooScripted = ''")).toBe(false);
    expect(regex.test("Script = ''")).toBe(true);
  });

  test("prefix regex matches only variables starting with the marker", () => {
    const grammar = new InjectionGrammar(
      { python: "source.python" },
      {},
      { prefix: { py: "python" } },
    ).toBeforeStringJSON();

    const regex = patternBegin(
      findVariableMarkerPattern(grammar, "py", "prefix"),
    );

    expect(regex.exec("pyExample = ''")?.slice(1, 4)).toEqual([
      "pyExample",
      " = ",
      "''",
    ]);
    expect(regex.test("copy = ''")).toBe(false);
    expect(regex.test("py = ''")).toBe(true);
  });

  test("allows simple regex operators in marker text", () => {
    const grammar = new InjectionGrammar(
      { "shell|bash|sh": "source.shell" },
      {},
      { suffix: { "Script+": "shell" } },
    ).toBeforeStringJSON();

    const pattern = findVariableMarkerPattern(grammar, "Script+", "suffix");
    expect(pattern).toMatchObject({
      begin: "\\b([A-Za-z0-9_'-]*(?:Script+))\\b([^\\n]*?)('')",
    });

    const regex = patternBegin(pattern);
    expect(regex.exec("fooScriptt = ''")?.slice(1, 4)).toEqual([
      "fooScriptt",
      " = ",
      "''",
    ]);
    expect(regex.test("fooScrip = ''")).toBe(false);
  });

  test("skips markers with unsupported regex syntax", () => {
    const grammar = new InjectionGrammar(
      { "shell|bash|sh": "source.shell" },
      {},
      { suffix: { "(Script)": "shell", "Script.": "shell" } },
    ).toBeforeStringJSON();

    expect(
      findVariableMarkerPattern(grammar, "(Script)", "suffix"),
    ).toBeUndefined();
    expect(
      findVariableMarkerPattern(grammar, "Script.", "suffix"),
    ).toBeUndefined();
  });

  test("skips markers whose language id does not resolve", () => {
    const grammar = new InjectionGrammar(
      { "shell|bash|sh": "source.shell" },
      {},
      { suffix: { Script: "missing" } },
    ).toBeforeStringJSON();

    expect(
      findVariableMarkerPattern(grammar, "Script", "suffix"),
    ).toBeUndefined();
  });
});
