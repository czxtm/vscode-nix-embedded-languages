import fs from "node:fs";
import path from "node:path";
import { FUNCTION_BINDINGS, LANGUAGES } from "./constants";
import {
  type FunctionBindings,
  InjectionGrammar,
  type LanguagesMap,
  type VariableMarkerBindings,
} from "./injection-grammar";

const ROOT_DIR = path.join(__dirname, "..");
const SYNTAXES_DIR = path.join(ROOT_DIR, "syntaxes");
const NIX_INJECTION_GRAMMAR_PATH = path.join(
  SYNTAXES_DIR,
  "source.nix.injection.tmLanguage.json",
);
const NIX_BEFORE_STRING_GRAMMAR_PATH = path.join(
  SYNTAXES_DIR,
  "source.nix.before-string.injection.tmLanguage.json",
);

/**
 * Generate the injection grammar files from the given languages map.
 * Returns true if any files were changed.
 */
export const generateFiles = (
  allLanguages: LanguagesMap = LANGUAGES,
  functionBindings: FunctionBindings = FUNCTION_BINDINGS,
  variableMarkerBindings: VariableMarkerBindings = {},
): boolean => {
  const injectionGrammar = new InjectionGrammar(
    allLanguages,
    functionBindings,
    variableMarkerBindings,
  );

  // Grammar for patterns INSIDE strings (# shell, # syntax: python, // syntax: js)
  const insideStringGrammar = injectionGrammar.toJSON();
  const insideChanged = writeJsonFileIfChanged(
    NIX_INJECTION_GRAMMAR_PATH,
    insideStringGrammar,
  );

  // Grammar for patterns BEFORE strings (# syntax: json before '' string)
  const beforeStringGrammar = injectionGrammar.toBeforeStringJSON();
  const beforeChanged = writeJsonFileIfChanged(
    NIX_BEFORE_STRING_GRAMMAR_PATH,
    beforeStringGrammar,
  );

  return insideChanged || beforeChanged;
};

const writeJsonFileIfChanged = (filePath: string, data: unknown): boolean => {
  const next = `${JSON.stringify(data, null, 2)}\n`;

  if (fs.existsSync(filePath)) {
    const current = fs.readFileSync(filePath, { encoding: "utf8" });
    if (current === next) {
      return false;
    }
  }

  if (!fs.existsSync(path.dirname(filePath))) {
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
  }

  fs.writeFileSync(filePath, next, { encoding: "utf8" });
  return true;
};

// Run when executed directly
if (require.main === module || process.argv[1]?.includes("generate")) {
  console.log("Generating grammar files...");
  const changed = generateFiles();
  console.log(changed ? "Grammar files updated." : "No changes needed.");
}
