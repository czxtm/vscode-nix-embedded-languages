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

### Pattern 4: Lua-style comment `-- syntax:` (inside string)

For languages where `--` is a comment:

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

### Example Configuration

```json
{
  "nix-embedded-languages.include": {
    "hcl|terraform": {
      "name": "HCL/Terraform",
      "scopeName": "source.hcl"
    }
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
