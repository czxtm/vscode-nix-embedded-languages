{ lib, pkgs, ... }: {
  # =====================================
  # Nix Embedded Languages - Examples
  # =====================================
  # This file demonstrates all supported syntax patterns for embedded languages.

  # -------------------------------------
  # Pattern 1: Short form (# lang) inside string
  # -------------------------------------
  # Use `# lang` on its own line inside the string
  shortFormExample = {
    exec = ''
      # shell
      echo "Hello from shell!"
      ls -la
    '';

    pythonCode = ''
      # python
      def greet(name):
          print(f"Hello, {name}!")
      greet("World")
    '';
  };

  # -------------------------------------
  # Pattern 2: Explicit form (# syntax: lang) inside string
  # -------------------------------------
  # Use `# syntax: lang` for clarity
  explicitFormExample = {
    exec = ''
      # syntax: shell
      echo "Using explicit syntax marker"
      for i in 1 2 3; do
        echo "$i"
      done
    '';
  };

  # -------------------------------------
  # Pattern 3: C-style comment (// syntax: lang) inside string
  # -------------------------------------
  # Use `// syntax: lang` for languages where // is a comment
  cStyleCommentExample = {
    jsCode = ''
      // syntax: javascript
      const greeting = "Hello, world!";
      console.log(greeting);

      function add(a, b) {
        return a + b;
      }
    '';

    tsCode = ''
      // syntax: typescript
      interface User {
        name: string;
        age: number;
      }

      const user: User = { name: "Alice", age: 30 };
    '';
  };

  # -------------------------------------
  # Pattern 4: Comment BEFORE string (# syntax: lang)
  # -------------------------------------
  # For languages without comments (like JSON), put the marker BEFORE the string
  # syntax: json
  jsonData = ''
    {
      "name": "example",
      "version": "1.0.0",
      "dependencies": {
        "lodash": "^4.17.21"
      }
    }
  '';

  # Multiple before-string examples
  # syntax: json
  configData = ''
    {
      "enabled": true,
      "settings": {
        "theme": "dark",
        "fontSize": 14
      }
    }
  '';

  myScript = ''
    echo "hello"
  '';

  # -------------------------------------
  # Pattern 5: Automatic detection via writeShellScript-style calls
  # -------------------------------------
  # Bound functions (writeShellScript, writeBash, writeDash, ...) auto-apply
  # shell highlighting to their '' argument — no marker needed.
  functionBindingExamples = {
    writeShellScriptExample = pkgs.writeShellScript "greet" ''
      echo "Hello from writeShellScript!"
      for i in 1 2 3; do
        echo "$i"
      done
    '';

    writeShellScriptBinExample = pkgs.writeShellScriptBin "greet-bin" ''
      echo "Hello from writeShellScriptBin!"
      for i in 1 2 3; do
        echo "$i"
      done
    '';

    writeBashExample = pkgs.writeBash ''
      set -euo pipefail
      echo "Hello from writeBash"
    '';

    writeDashExample = pkgs.writeDash "quick" ''
      echo "Hello from writeDash"
    '';

    # With nix-embedded-languages.variableMarkers.suffix = { Script = "shell"; }
    fooScript = ''
      echo "Hello from a  variable"
    '';
  };

  # -------------------------------------
  # Supported Languages
  # -------------------------------------
  # All languages with their aliases:
  # - shell|bash|sh
  # - python|py
  # - javascript|js
  # - typescript|ts
  # - json
  # - yaml|yml
  # - sql
  # - lua
  # - ruby|rb
  # - rust|rs
  # - go|golang
  # - html
  # - css
  # - nix

  moreExamples = {
    lua = ''
      # lua
      local function hello()
        print("Hello from Lua!")
      end
      hello()
    '';

    sql = ''
      # sql
      SELECT id, name, email
      FROM users
      WHERE active = true
      ORDER BY created_at DESC;
    '';

    rust = ''
      // syntax: rust
      fn main() {
          let greeting = "Hello, Rust!";
          println!("{}", greeting);
      }
    '';

    go = ''
      // syntax: go
      package main

      import "fmt"

      func main() {
          fmt.Println("Hello, Go!")
      }
    '';

    html = ''
      # html
      <!DOCTYPE html>
      <html>
        <head><title>Test</title></head>
        <body>
          <h1>Hello, HTML!</h1>
        </body>
      </html>
    '';

    css = ''
      # css
      .container {
        display: flex;
        justify-content: center;
        align-items: center;
      }
    '';

    yaml = ''
      # yaml
      name: example
      version: 1.0.0
      services:
        web:
          port: 8080
    '';
  };

  # -------------------------------------
  # Original example content below
  # -------------------------------------
  # Global Helper Scripts
  # -----------------------------------
  # https://devenv.sh/scripts/
  scripts = {
    # Fast task runner that bypasses devenv overhead when already in shell
    # Usage: task <task-name> or task --list
    task = {
      description = "Run a devenv task directly (fast, no shell setup overhead)";
      exec = ''
        # shell
        set -euo pipefail

        # Ensure we're in a devenv shell
        if [[ -z "''${DEVENV_ROOT:-}" ]]; then
          echo "Error: Not in a devenv shell. Use 'devenv tasks run' instead." >&2
          exit 1
        fi

        # Parse arguments
        if [[ $# -eq 0 ]] || [[ "$1" == "--help" ]] || [[ "$1" == "-h" ]]; then
          echo "Usage: task <task-name> [--list|-l]"
          echo ""
          echo "Run devenv tasks directly without shell setup overhead."
          echo "This is much faster than 'devenv tasks run' when already in the shell."
          echo ""
          echo "Options:"
          echo "  --list, -l    List all available tasks"
          echo "  --help, -h    Show this help message"
          exit 0
        fi

        if [[ "$1" == "--list" ]] || [[ "$1" == "-l" ]]; then
          echo "Available tasks:"
          echo "$DEVENV_TASKS" | jq -r '.[] | "  \(.name)\t\(.description // "")"' | column -t -s $'\t'
          exit 0
        fi

        TASK_NAME="$1"
        shift

        # Find the task in DEVENV_TASKS
        TASK_INFO=$(echo "$DEVENV_TASKS" | jq -r --arg name "$TASK_NAME" '.[] | select(.name == $name)')

        if [[ -z "$TASK_INFO" ]]; then
          echo "Error: Task '$TASK_NAME' not found." >&2
          echo "Use 'task --list' to see available tasks." >&2
          exit 1
        fi

        # Extract task properties
        COMMAND=$(echo "$TASK_INFO" | jq -r '.command // empty')
        CWD=$(echo "$TASK_INFO" | jq -r '.cwd // empty')

        if [[ -z "$COMMAND" ]]; then
          echo "Error: Task '$TASK_NAME' has no command." >&2
          exit 1
        fi

        # Change to task directory if specified
        if [[ -n "$CWD" ]] && [[ "$CWD" != "null" ]]; then
          cd "$CWD"
        fi

        # Execute the task command
        exec "$COMMAND" "$@"
      '';
    };

    # helper to create a menu
    menu = {
      description = "Show the Devenv menu";
      exec = /* shell */ ''
        # nix-embedded-languages: shellscript
        ROOT="''${DEVENV_ROOT:-$PWD}"
        KIWI=156; ORANGE=215; PINK=212; PURPLE=99; PRIMARY=7; BRIGHT=15; FAINT=103; DARK=238;
        label() {
          gum style --width 20 --foreground $PINK "$1"
        }
        subtitle() {
          gum style --foreground $PURPLE "$1"
        }
        description() {
          gum style --foreground $FAINT "$1"
        }
        rows=$(echo $DEVENV_TASKS | jq -r '.[] | "\(.name)|\(.description)"')
        printf "command|description\n$rows" \
          | gum table -s '|'  --header.foreground $FAINT --selected.foreground $ORANGE --border.foreground 238 -b rounded --padding "1 1" \
          | cut -d'|' -f1 \
          | xargs -I {} /bin/bash -c 'devenv tasks run {}'
      '';
    };

    get-turbo-token = {
      description = "Get the turbo token from the environment";
      exec = ''
        ROOT="$DEVENV_ROOT"
        if [ -z "$ROOT" ]; then
          ROOT=$(git rev-parse --show-toplevel)
        fi
        $ROOT/scripts/env.workspace.sh echo $TURBO_TOKEN
      '';
    };

    get-username = {
      description = "Get the AWS username from the current IAM identity";
      exec = ''
        AWS_PROFILE=darkmatter-dev
        ROLE_ARN=$(aws sts get-caller-identity --profile $AWS_PROFILE --query "Arn" --output text)
        export DM_USERNAME=$(echo $ROLE_ARN | cut -d/ -f3 | cut -d@ -f1)
        echo $DM_USERNAME
      '';
    };

    get-ports = {
      description = "Get the ports from the docker compose services";
      exec = ''
        # inside docker do nothing
        if [ -f "/.dockerenv" ]; then
          exit 0
        fi

        # If docker-compose is not installed, do nothing
        if ! command -v docker-compose >/dev/null; then
          exit 0
        fi

        postgres_host=$(docker compose port postgres 5432)
        redis_host=$(docker compose port redis 6379)

        export POSTGRES_URL=$(echo $POSTGRES_URL | sed "s/postgres:5432/''${postgres_host}/")
        export REDIS_URL=$(echo $REDIS_URL | sed "s/redis:6379/''${redis_host}/")
      '';
    };

    start-tunnel = {
      description = "Start the SSH tunnel to the remote Docker daemon";
      exec = ''
        export AWS_PROFILE=darkmatter-dev

        # login if needed
        aws configure export-credentials --profile $AWS_PROFILE > /dev/null 2>&1 || \
          aws sso login --profile $AWS_PROFILE

        DM_USERNAME=$(get-username)

        # Kill any existing SSH tunnel
        lsof -i :2375 -t | xargs kill -9 > /dev/null 2>&1 && \
          echo "Killed existing SSH tunnel to remote Docker..." >&2

        # Create a temporary SSH config file
        SSH_CONFIG_FILE=$(mktemp)
        cat > "$SSH_CONFIG_FILE" <<EOF
        Host darkmatter-remote-dev
          HostName drkmttr-hz-de.tail6277a6.ts.net
          User $DM_USERNAME
          StrictHostKeyChecking no
          LocalForward 2375 localhost:2375
        EOF

        # Only run ssh if not already established
        if ! pgrep -f "ssh.*-F \"$SSH_CONFIG_FILE\" darkmatter-remote-dev" >/dev/null; then
          echo "Setting up SSH tunnel to remote Docker..." >&2
          ssh -f -N -F "$SSH_CONFIG_FILE" darkmatter-remote-dev -o StrictHostKeyChecking=no
          echo "🛜 Remote Docker tunnel established"
        else
          echo "🟢 SSH tunnel already established - to kill it run:"
          echo "  lsof -i :2375 -t | xargs kill -9"
        fi

        export TESTCONTAINERS_DOCKER_CLIENT_STRATEGY="org.testcontainers.dockerclient.EnvironmentAndSystemPropertyClientProviderStrategy"
        export DOCKER_HOST=tcp://localhost:2375
        export TESTCONTAINERS_HOST_OVERRIDE=drkmttr-hz-de

        echo "Note: All docker commands in this shell will use the remote daemon until the tunnel is killed."
      '';
    };

    ensure-valid-token = {
      description = "Ensure a valid token is set";
      exec = ''
        echo "Ensuring AWS credentials are valid"
        if aws sts get-caller-identity --profile darkmatter-dev > /dev/null; then
          echo "✅ AWS credentials are valid"
        else
          echo "AWS credentials are invalid - logging in"
          aws sso login --profile darkmatter-dev
        fi
      '';
    };

    activate = {
      description = "Source the MOTD script";
      exec = ''
        source $DEVENV_ROOT/scripts/activate.sh
      '';
    };

    validate-cache = {
      description = "Execute a command if files have been modified";
      exec = ''
        set -euo pipefail
        CACHEFILE="$DEVENV_STATE/checksums.cache"
        files=$(echo "$@")
        shift
        touch "$CACHEFILE"
        expected=$(cat "$CACHEFILE" | grep $input_file)
        actual=$(sha256sum "$input_file")
        if [ -n "$expected" ] && [ "$expected" == "$actual" ]; then
          exit 0
        fi
        cat "$CACHEFILE" | grep -v "$input_file" > "$CACHEFILE"
        exit 1
      '';
    };
  };

  # https://devenv.sh/basics/
  env = {
    COMPOSE_DOCKER_CLI_BUILD = "1";
    DOCKER_BUILDKIT = "1";
    TURBO_TEAM = "darkmatterlabs";
    AWS_PROFILE = "darkmatter-dev";
    AWS_REGION = "us-west-2";
    AWS_DEFAULT_REGION = "us-west-2";
    AWS_START_URL = "https://dark-matter.awsapps.com/start";
  };

  # -------------------------------------
  # Enter Shell
  # -----------------------------------

  # https://devenv.sh/basics/
  # enterShell = lib.mkDefault '''';

  # https://devenv.sh/automatic-shell-activation/
  # dotenv.enable = true;

  # https://devenv.sh/guides/using-with-cachix/
  # cachix.enable = true;
  cachix.pull = lib.mkDefault [
    "devenv"
    "darkmatter"
  ];
}
