<div align="center">

# Nix Embedded Languages

![GitHub License](https://img.shields.io/github/license/coopmoney/vscode-nix-embedded-languages?style=for-the-badge)
<!-- ![Visual Studio Marketplace Version](https://img.shields.io/visual-studio-marketplace/v/cooppmoney.nix-embedded-languages?style=for-the-badge) -->

</div>

## Features

Syntax highlighting for embedded languages inside Nix multi-line strings (`'' ... ''`).

## Usage

### Pattern 1: Short form (inside string)

Place `# lang` on its own line inside the string:

```nix
script = ''
  # shell
  echo "Hello, world!"
  ls -la
'';
```

### Pattern 2: Explicit form with `# syntax:` (inside string)

For clarity, use `# syntax: lang`:

```nix
script = ''
  # syntax: python
  def greet(name):
      print(f"Hello, {name}!")
  greet("World")
'';
```

### Pattern 3: Typescript / C-style comment `// syntax:` (inside string)

For languages where `//` is a comment:

```nix
code = ''
  // syntax: javascript
  const greeting = "Hello!";
  console.log(greeting);
'';
```

### Pattern 4: Double-dash comment `-- syntax:` (inside string)

For languages where `--` is a valid comment, such as Lua and SQL:

```nix
initLua = ''
  -- syntax: lua
  function greet(name)
    print("Hello, " .. name)
  end
'';
```

### Pattern 5: Comment before string (for JSON, etc.)

For languages without comments (like JSON), place the marker BEFORE the string as a Nix comment:

```nix
# syntax: json
configData = ''
  {
    "name": "example",
    "version": "1.0.0"
  }
'';
```

### Pattern 5: Tree-sitter compatible block comment before string

You can also use the Nix block comment directive form recognized by tree-sitter:

```nix
shellCode = /* shell */ ''
  cp foo bar
'';
```

### Pattern 6: Automatic detection via `pkgs.writeShellScript`-style calls

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
| `nix-embedded-languages.include` | Add custom languages. Key is the identifier (supports regex), value is either the TextMate scope name or an object with `name` and `scopeName` (required) properties. |
| `nix-embedded-languages.functionBindings` | Map a Nix function name pattern (regex alternation allowed) to a language identifier from the built-in languages or `include`. When the function is called with a `''` multiline string argument on the same line, the string is automatically highlighted as that language. Merged with built-in bindings (`writeShellScript`, `writeShellScriptBin`, `writeScript`, `writeScriptBin`, `writeBash`, `writeBashBin`, `writeDash` → `shell`); user keys override. |
| `nix-embedded-languages.enableFunctionBindings` | Enable built-in function-call bindings (default `true`). Set to `false` to disable only the built-in bindings; user-defined `functionBindings` still apply. |

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
    "writeNushell|writeNu": "nushell"
  }
}
```

## Requirements

- The [Nix IDE](https://marketplace.visualstudio.com/items?itemName=jnoortheen.nix-ide) extension (or another extension providing `source.nix` grammar)


## Contributing

1. Install [devenv](https://devenv.sh/getting-started/)
1. Load development environment:
   ```bash
    $ devenv shell
   ```
