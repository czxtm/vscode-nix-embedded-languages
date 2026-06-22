import { describe, expect, test } from "bun:test";
import { InjectionGrammar } from "../src/injection-grammar";
import { embeddedPatterns } from "./helpers";

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

    const pattern = findFunctionPattern(
      grammar,
      "writeShellScript|writeShellScriptBin",
    );
    expect(pattern).toMatchObject({
      begin: "\\b((?:writeShellScript|writeShellScriptBin))\\b([^\\n]*?)('')",
      end: "^\\s*''(?!')",
      beginCaptures: {
        "1": { name: "support.function.nix meta.embedded.hint.nix" },
        "3": {
          name: "string.quoted.other.nix punctuation.definition.string.begin.nix",
        },
      },
      endCaptures: {
        "0": {
          name: "string.quoted.other.nix punctuation.definition.string.end.nix",
        },
      },
      contentName: "meta.embedded.block.shell string.quoted.other.nix",
      patterns: embeddedPatterns("source.shell"),
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
    expect(findFunctionPattern(grammar, "myFunc|myOtherFunc")).toBeUndefined();
  });

  test("skips function patterns with unsupported regex syntax", () => {
    const grammar = new InjectionGrammar(
      { "shell|bash|sh": "source.shell" },
      { "write(Shell)Script": "shell", "write.Script": "shell" },
    ).toBeforeStringJSON();

    expect(findFunctionPattern(grammar, "write(Shell)Script")).toBeUndefined();
    expect(findFunctionPattern(grammar, "write.Script")).toBeUndefined();
  });

  test("resolves language id by any alias in the languages map", () => {
    const grammar = new InjectionGrammar(
      { "shell|bash|sh": "source.shell" },
      { writeBash: "bash" },
    ).toBeforeStringJSON();
    const pattern = findFunctionPattern(grammar, "writeBash");
    expect(pattern).toMatchObject({
      begin: "\\b((?:writeBash))\\b([^\\n]*?)('')",
      contentName: "meta.embedded.block.shell string.quoted.other.nix",
      patterns: embeddedPatterns("source.shell"),
    });
  });

  test("single function name only captures the function as group 1", () => {
    const grammar = new InjectionGrammar(
      { "shell|bash|sh": "source.shell" },
      { writeDash: "shell" },
    ).toBeforeStringJSON();
    const pattern = findFunctionPattern(grammar, "writeDash");
    expect(pattern).toMatchObject({
      begin: "\\b((?:writeDash))\\b([^\\n]*?)('')",
    });
  });

  test("allows simple regex operators in function patterns", () => {
    const grammar = new InjectionGrammar(
      { "shell|bash|sh": "source.shell" },
      { "writeBash|writeBashBin": "shell" },
    ).toBeforeStringJSON();
    const pattern = findFunctionPattern(grammar, "writeBash|writeBashBin");
    expect(pattern).toMatchObject({
      begin: "\\b((?:writeBash|writeBashBin))\\b([^\\n]*?)('')",
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

    expect(
      findFunctionPattern(grammar, "writeShellScript|writeShellScriptBin"),
    ).toBeUndefined();
    expect(findFunctionPattern(grammar, "myCustomFunc")).toBeDefined();
  });
});
