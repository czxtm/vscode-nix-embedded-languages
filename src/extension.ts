import packageJson from "@package";
import vscode from "vscode";
import {
  ENABLE_FUNCTION_BINDINGS_CONFIG,
  FUNCTION_BINDINGS_CONFIG,
  INCLUDE_CONFIG,
  LANGUAGES,
  FUNCTION_BINDINGS,
  SUB_ENABLE_FUNCTION_BINDINGS_CONFIG,
  SUB_FUNCTION_BINDINGS_CONFIG,
  SUB_INCLUDE_CONFIG,
  VERSION_STATE,
} from "./constants";
import { generateFiles } from "./generate";
import type { FunctionBindings, LanguagesMap } from "./injection-grammar";

const updateExtension = () => {
  const settings = vscode.workspace.getConfiguration(packageJson.name);
  const includeLanguages = settings.get<LanguagesMap>(SUB_INCLUDE_CONFIG) ?? {};
  const allLanguages: LanguagesMap = { ...LANGUAGES, ...includeLanguages };

  const userFunctionBindings =
    settings.get<FunctionBindings>(SUB_FUNCTION_BINDINGS_CONFIG) ?? {};
  const enableBuiltins = settings.get<boolean>(
    SUB_ENABLE_FUNCTION_BINDINGS_CONFIG,
    true,
  );
  const allFunctionBindings: FunctionBindings = {
    ...(enableBuiltins ? FUNCTION_BINDINGS : {}),
    ...userFunctionBindings,
  };

  const filesChanged = generateFiles(allLanguages, allFunctionBindings);

  if (filesChanged) {
    vscode.window
      .showInformationMessage("Reload window to apply changes?", "Yes", "No")
      .then((choice) => {
        if (choice === "Yes") {
          vscode.commands.executeCommand("workbench.action.reloadWindow");
        }
      });
  }
};

export const activate = (context: vscode.ExtensionContext) => {
  const currentVersion = packageJson.version;
  const previousVersion = context.globalState.get<string>(VERSION_STATE);

  if (previousVersion !== currentVersion) {
    updateExtension();
    context.globalState.update(VERSION_STATE, currentVersion);
  }

  context.subscriptions.push(
    vscode.workspace.onDidChangeConfiguration((event) => {
      if (
        event.affectsConfiguration(INCLUDE_CONFIG) ||
        event.affectsConfiguration(FUNCTION_BINDINGS_CONFIG) ||
        event.affectsConfiguration(ENABLE_FUNCTION_BINDINGS_CONFIG)
      ) {
        updateExtension();
      }
    }),
  );
};

export const deactivate = () => {};
