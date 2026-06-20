<div align="center">

# Nix Embedded Languages

![GitHub License](https://img.shields.io/github/license/coopmoney/vscode-nix-embedded-languages?style=for-the-badge)
<!-- ![Visual Studio Marketplace Version](https://img.shields.io/visual-studio-marketplace/v/cooppmoney.nix-embedded-languages?style=for-the-badge) -->

</div>

## Features

Syntax highlighting for embedded languages inside Nix multi-line strings (`'' ... ''`).

Supported activation styles, with the most automatic options first:

- automatic detection for configured function calls, such as `pkgs.writeShellScript "name" ''`
- automatic detection for configured variable name prefixes or suffixes, such as `fooScript = ''`
- comments inside the string, such as `# shell` or `# syntax: python`
- comments before the string, such as `# syntax: json` before an attribute assignment
- tree-sitter-compatible Nix block directives, such as `/* shell */ ''`

## Usage

### Pattern 1: Automatic detection via `pkgs.writeShellScript`-style calls

When a bound Nix function (e.g. `writeShellScript`, `writeBash`, `writeDash`) is
called with a `''` multiline string argument on the same line, the string
content is automatically highlighted as the bound language — no marker needed:

```nix
script = pkgs.writeShellScript "my-script" ''
  echo "Hello, world!"
  ls -la
'';
```

Built-in bindings (all highlight as shell/bash):

| Function | Aliases |
| -------- | ------- |
| `writeShellScript`, `writeShellScriptBin` | bash |
| `writeScript`, `writeScriptBin` | legacy bash |
| `writeBash`, `writeBashBin` | bash |
| `writeDash` | dash (sh) |

The function name may be prefixed (e.g. `pkgs.writeShellScript`,
`lib.writeShellScript`) or bare (after `inherit`). The opening `''` must appear
on the same line as the function call.

### Pattern 2: Automatic detection via variable name prefixes or suffixes

You can configure variable name markers that imply an embedded language. For
example, with this setting:

```json
{
  "nix-embedded-languages.variableMarkers.suffix": {
    "Script": "shell"
  }
}
```

variables ending in `Script` are highlighted as shell when assigned a multiline
string:

```nix
fooScript = ''
  echo "Hello, world!"
'';
```

Prefix markers work the same way with
`nix-embedded-languages.variableMarkers.prefix`.

### Pattern 3: Short form (inside string)

Place `# lang` on its own line inside the string:

```nix
script = ''
  # shell
  echo "Hello, world!"
  ls -la
'';
```

### Pattern 4: Explicit form with `# syntax:` (inside string)

For clarity, use `# syntax: lang`:

```nix
script = ''
  # syntax: python
  def greet(name):
      print(f"Hello, {name}!")
  greet("World")
'';
```

### Pattern 5: Typescript / C-style comment `// syntax:` (inside string)

For languages where `//` is a comment:

```nix
code = ''
  // syntax: javascript
  const greeting = "Hello!";
  console.log(greeting);
'';
```

### Pattern 6: Double-dash comment `-- syntax:` (inside string)

For languages where `--` is a valid comment, such as Lua and SQL:

```nix
initLua = ''
  -- syntax: lua
  function greet(name)
    print("Hello, " .. name)
  end
'';
```

### Pattern 7: Comment before string (for JSON, etc.)

For languages without comments (like JSON), place the marker before the string as
a Nix comment. This form is useful when the embedded language cannot safely carry
its own syntax marker:

```nix
# syntax: json
configData = ''
  {
    "name": "example",
    "version": "1.0.0"
  }
'';
```

The `''` string opener can appear after a simple same-line Nix declaration. The
embedded highlighting stops before the closing multiline-string delimiter.

### Pattern 8: Tree-sitter compatible block comment before string

You can also use the Nix block comment directive form recognized by tree-sitter:

```nix
shellCode = /* shell */ ''
  cp foo bar
'';
```

## Built-In Languages

| Language | Identifiers |
| ---------- | --------------------- |
| Shell | `shell`, `bash`, `sh` |
| Python | `python`, `py` |
| JavaScript | `javascript`, `js` |
| TypeScript | `typescript`, `ts` |
| JSON | `json` |
| YAML | `yaml`, `yml` |
| SQL | `sql` |
| Lua | `lua` |
| Ruby | `ruby`, `rb` |
| Rust | `rust`, `rs` |
| Go | `go`, `golang` |
| HTML | `html` |
| CSS | `css` |
| Nix | `nix` |

## Extension Settings

| Name | Description |
| -------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `nix-embedded-languages.include` | Add custom languages. Keys allow identifier characters plus alternation, `*`, `+`, and `?` regex operators only; escape those operators if you need literal matching. Value is either the TextMate scope name or an object with `name` and `scopeName` (required) properties. |
| `nix-embedded-languages.functionBindings` | Map a Nix function name pattern to a language identifier from the built-in languages or `include`. Patterns allow identifier characters plus alternation, `*`, `+`, and `?` regex operators only; escape those operators if you need literal matching. When the function is called with a `''` multiline string argument on the same line, the string is automatically highlighted as that language. Merged with built-in bindings (`writeShellScript`, `writeShellScriptBin`, `writeScript`, `writeScriptBin`, `writeBash`, `writeBashBin`, `writeDash` → `shell`); user keys override. |
| `nix-embedded-languages.variableMarkers.prefix` | Map variable name prefixes to a language identifier from the built-in languages or `include`. For example, `{ "script": "shell" }` highlights variables like `scriptFoo = ''` as shell. Markers allow identifier characters plus alternation, `*`, `+`, and `?` regex operators only; escape those operators if you need literal matching. |
| `nix-embedded-languages.variableMarkers.suffix` | Map variable name suffixes to a language identifier from the built-in languages or `include`. For example, `{ "Script": "shell" }` highlights variables like `fooScript = ''` as shell. Markers allow identifier characters plus alternation, `*`, `+`, and `?` regex operators only; escape those operators if you need literal matching. |
| `nix-embedded-languages.enableFunctionBindings` | Enable built-in function-call bindings (default `true`). Set to `false` to disable only the built-in bindings; user-defined `functionBindings` still apply. |

### Regex fragments in configuration keys

Custom language identifiers, function bindings, and variable markers accept only
restricted regex fragments in their keys. Allowed regex operators are:

- `|` for alternation
- `*` for zero or more
- `+` for one or more
- `?` for optional

Other regex syntax, such as groups, character classes, anchors, and `.`, is not
accepted. If you need one of the allowed operator characters literally, escape it
in your setting key.

### Example Configuration

```json
{
  "nix-embedded-languages.include": {
    "hcl|terraform": {
      "name": "HCL/Terraform",
      "scopeName": "source.hcl"
    }
  },
  "nix-embedded-languages.functionBindings": {
    "writeNushell|writeNu": "hcl"
  },
  "nix-embedded-languages.variableMarkers.suffix": {
    "Script": "shell"
  },
  "nix-embedded-languages.variableMarkers.prefix": {
    "py": "python"
  }
}
```

## Requirements

- The [Nix IDE](https://marketplace.visualstudio.com/items?itemName=jnoortheen.nix-ide) extension (or another extension providing `source.nix` grammar)

## Contributing

1. Install [devenv](https://devenv.sh/getting-started/)
1. Load development environment:

```bash
devenv shell
```
