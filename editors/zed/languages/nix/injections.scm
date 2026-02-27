; Embedded language injection via comment before multi-line string.
;
; Place a comment like `# shell`, `# python`, `# json`, etc. directly
; before a multi-line string ('' ... '') to get syntax highlighting
; for that language inside the string.
;
; Example:
;   # json
;   configData = ''
;     { "name": "example" }
;   '';
;
; The comment text (after stripping `# `) is used as the language name.
((((comment) @injection.language) .
  (indented_string_expression
    (string_fragment) @injection.content))
  (#set! injection.combined))

; Standard Nix injection patterns:

; Highlight comments
((comment) @injection.content
  (#set! injection.language "comment"))

; builtins.match regex injection
(apply_expression
  function: (_) @_func
  argument: [
    (string_expression
      ((string_fragment) @injection.content
        (#set! injection.language "regex")))
    (indented_string_expression
      ((string_fragment) @injection.content
        (#set! injection.language "regex")))
  ]
  (#match? @_func "(^|\\.)match$"))

; Phase/Hook/Script bash injection
(binding
  attrpath: (attrpath
    (identifier) @_path)
  expression: [
    (string_expression
      ((string_fragment) @injection.content
        (#set! injection.language "bash")))
    (indented_string_expression
      ((string_fragment) @injection.content
        (#set! injection.language "bash")))
  ]
  (#match? @_path "(^\\w+(Phase|Hook|Check)|(pre|post)[A-Z]\\w+|script)$"))

; writeShellApplication text injection
(apply_expression
  function: (_) @_func
  argument: (_
    (_)*
    (_
      (_)*
      (binding
        attrpath: (attrpath
          (identifier) @_path)
        expression: [
          (string_expression
            ((string_fragment) @injection.content
              (#set! injection.language "bash")))
          (indented_string_expression
            ((string_fragment) @injection.content
              (#set! injection.language "bash")))
        ])))
  (#match? @_func "(^|\\.)writeShellApplication$")
  (#match? @_path "^text$")
  (#set! injection.combined))

; runCommand bash injection
(apply_expression
  function: (apply_expression
    function: (apply_expression
      function: (_) @_func))
  argument: [
    (string_expression
      ((string_fragment) @injection.content
        (#set! injection.language "bash")))
    (indented_string_expression
      ((string_fragment) @injection.content
        (#set! injection.language "bash")))
  ]
  (#match? @_func "(^|\\.)runCommand((No)?CC)?(Local)?$")
  (#set! injection.combined))

; writeBash/writeDash/writeShellScript bash injection
((apply_expression
  function: (apply_expression
    function: (_) @_func)
  argument: [
    (string_expression
      ((string_fragment) @injection.content
        (#set! injection.language "bash")))
    (indented_string_expression
      ((string_fragment) @injection.content
        (#set! injection.language "bash")))
  ])
  (#match? @_func "(^|\\.)write(Bash|Dash|ShellScript)(Bin)?$")
  (#set! injection.combined))

; writeFish injection
((apply_expression
  function: (apply_expression
    function: (_) @_func)
  argument: [
    (string_expression
      ((string_fragment) @injection.content
        (#set! injection.language "fish")))
    (indented_string_expression
      ((string_fragment) @injection.content
        (#set! injection.language "fish")))
  ])
  (#match? @_func "(^|\\.)writeFish(Bin)?$")
  (#set! injection.combined))

; writeHaskell injection
((apply_expression
  function: (apply_expression
    function: (apply_expression
      function: (_) @_func))
  argument: [
    (string_expression
      ((string_fragment) @injection.content
        (#set! injection.language "haskell")))
    (indented_string_expression
      ((string_fragment) @injection.content
        (#set! injection.language "haskell")))
  ])
  (#match? @_func "(^|\\.)writeHaskell(Bin)?$")
  (#set! injection.combined))

; writeJS injection
((apply_expression
  function: (apply_expression
    function: (apply_expression
      function: (_) @_func))
  argument: [
    (string_expression
      ((string_fragment) @injection.content
        (#set! injection.language "javascript")))
    (indented_string_expression
      ((string_fragment) @injection.content
        (#set! injection.language "javascript")))
  ])
  (#match? @_func "(^|\\.)writeJS(Bin)?$")
  (#set! injection.combined))

; writePerl injection
((apply_expression
  function: (apply_expression
    function: (apply_expression
      function: (_) @_func))
  argument: [
    (string_expression
      ((string_fragment) @injection.content
        (#set! injection.language "perl")))
    (indented_string_expression
      ((string_fragment) @injection.content
        (#set! injection.language "perl")))
  ])
  (#match? @_func "(^|\\.)writePerl(Bin)?$")
  (#set! injection.combined))

; writePython injection
((apply_expression
  function: (apply_expression
    function: (apply_expression
      function: (_) @_func))
  argument: [
    (string_expression
      ((string_fragment) @injection.content
        (#set! injection.language "python")))
    (indented_string_expression
      ((string_fragment) @injection.content
        (#set! injection.language "python")))
  ])
  (#match? @_func "(^|\\.)write(PyPy|Python)[23](Bin)?$")
  (#set! injection.combined))

; writeRust injection
((apply_expression
  function: (apply_expression
    function: (apply_expression
      function: (_) @_func))
  argument: [
    (string_expression
      ((string_fragment) @injection.content
        (#set! injection.language "rust")))
    (indented_string_expression
      ((string_fragment) @injection.content
        (#set! injection.language "rust")))
  ])
  (#match? @_func "(^|\\.)writeRust(Bin)?$")
  (#set! injection.combined))
