import packageJson from "@package";
import vscode from "vscode";
import {
  ENABLE_FUNCTION_BINDINGS_CONFIG,
  FUNCTION_BINDINGS,
  FUNCTION_BINDINGS_CONFIG,
  INCLUDE_CONFIG,
  LANGUAGES,
  SUB_ENABLE_FUNCTION_BINDINGS_CONFIG,
  SUB_FUNCTION_BINDINGS_CONFIG,
  SUB_INCLUDE_CONFIG,
  SUB_VARIABLE_MARKER_PREFIX_CONFIG,
  SUB_VARIABLE_MARKER_SUFFIX_CONFIG,
  VARIABLE_MARKER_PREFIX_CONFIG,
  VARIABLE_MARKER_SUFFIX_CONFIG,
  VERSION_STATE,
} from "./constants";
import { generateFiles } from "./generate";
import type {
  FunctionBindings,
  LanguagesMap,
  VariableMarkerBindings,
} from "./injection-grammar";

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

  const variableMarkerBindings: VariableMarkerBindings = {
    prefix:
      settings.get<Record<string, string>>(SUB_VARIABLE_MARKER_PREFIX_CONFIG) ??
      {},
    suffix:
      settings.get<Record<string, string>>(SUB_VARIABLE_MARKER_SUFFIX_CONFIG) ??
      {},
  };

  const filesChanged = generateFiles(
    allLanguages,
    allFunctionBindings,
    variableMarkerBindings,
  );

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
        event.affectsConfiguration(VARIABLE_MARKER_PREFIX_CONFIG) ||
        event.affectsConfiguration(VARIABLE_MARKER_SUFFIX_CONFIG) ||
        event.affectsConfiguration(ENABLE_FUNCTION_BINDINGS_CONFIG)
      ) {
        updateExtension();
      }
    }),
  );
};

export const deactivate = () => {};
