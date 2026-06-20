import { describe, expect, test } from "bun:test";
import { InjectionGrammar } from "../src/injection-grammar";

const findFunctionPattern = (
  grammar: ReturnType<InjectionGrammar["toBeforeStringJSON"]>,
  funcPattern: string,
) =>
  grammar.patterns.find(
    ({ comment }) => comment === `Match ${funcPattern} call before a '' string`,
  );

describe("function-call bindings", () => {
  test("generates a before-string pattern for writeShellScript -> shell", () => {
    const grammar = new InjectionGrammar(
      { "shell|bash|sh": { name: "shellscript", scopeName: "source.shell" } },
      { "writeShellScript|writeShellScriptBin": "shell" },
    ).toBeforeStringJSON();

    const pattern = findFunctionPattern(grammar, "writeShellScript|writeShellScriptBin");
    expect(pattern).toMatchObject({
      begin: "\\b(?:writeShellScript|writeShellScriptBin)\\b(?=[^\\n]*'')",
      end: "^\\s*''(?!')",
      beginCaptures: {
        "0": { name: "support.function.nix meta.embedded.hint.nix" },
      },
      endCaptures: {
        "0": {
          name: "string.quoted.other.nix punctuation.definition.string.end.nix",
        },
      },
      patterns: [
        {
          begin: "''",
          end: "(?=^\\s*''(?!'))",
          contentName: "meta.embedded.block.shell string.quoted.other.nix",
          patterns: [{ include: "source.shell" }],
        },
        { include: "source.nix" },
      ],
    });
  });

  test("emits no function-call patterns when functionBindings is empty", () => {
    const grammar = new InjectionGrammar(
      { "shell|bash|sh": "source.shell" },
      {},
    ).toBeforeStringJSON();
    expect(
      grammar.patterns.some(({ comment }) =>
        comment?.includes("call before a '' string"),
      ),
    ).toBe(false);
  });

  test("skips bindings whose language id does not resolve", () => {
    const grammar = new InjectionGrammar(
      { "shell|bash|sh": "source.shell" },
      { "myFunc|myOtherFunc": "nonexistent-lang" },
    ).toBeforeStringJSON();
    expect(
      findFunctionPattern(grammar, "myFunc|myOtherFunc"),
    ).toBeUndefined();
  });

  test("resolves language id by any alias in the languages map", () => {
    const grammar = new InjectionGrammar(
      { "shell|bash|sh": "source.shell" },
      { writeBash: "bash" },
    ).toBeforeStringJSON();
    const pattern = findFunctionPattern(grammar, "writeBash");
    expect(pattern).toMatchObject({
      begin: "\\bwriteBash\\b(?=[^\\n]*'')",
      patterns: [
        expect.objectContaining({
          contentName: "meta.embedded.block.shell string.quoted.other.nix",
          patterns: [{ include: "source.shell" }],
        }),
        { include: "source.nix" },
      ],
    });
  });

  test("single function name (no alternation) is not wrapped in a group", () => {
    const grammar = new InjectionGrammar(
      { "shell|bash|sh": "source.shell" },
      { writeDash: "shell" },
    ).toBeforeStringJSON();
    const pattern = findFunctionPattern(grammar, "writeDash");
    expect(pattern).toMatchObject({
      begin: "\\bwriteDash\\b(?=[^\\n]*'')",
    });
  });
});

describe("enableFunctionBindings toggle (simulated)", () => {
  test("empty built-in bindings when toggle disabled leaves only user bindings", () => {
    const enableBuiltins = false;
    const builtinBindings = { "writeShellScript|writeShellScriptBin": "shell" };
    const userBindings = { myCustomFunc: "shell" };
    const merged = {
      ...(enableBuiltins ? builtinBindings : {}),
      ...userBindings,
    };
    const grammar = new InjectionGrammar(
      { "shell|bash|sh": "source.shell" },
      merged,
    ).toBeforeStringJSON();

    expect(findFunctionPattern(grammar, "writeShellScript|writeShellScriptBin")).toBeUndefined();
    expect(findFunctionPattern(grammar, "myCustomFunc")).toBeDefined();
  });
});
