export const NIX_INTERPOLATION_PATTERN = {
  comment: "Match Nix interpolation inside embedded language",
  begin: "(?<!'')\\$\\{",
  beginCaptures: {
    "0": { name: "punctuation.section.embedded.begin.nix" },
  },
  end: "\\}",
  endCaptures: {
    "0": { name: "punctuation.section.embedded.end.nix" },
  },
  contentName: "meta.embedded.expression.nix",
  patterns: [{ include: "source.nix" }],
};

export const embeddedPatterns = (scopeName: string) => [
  NIX_INTERPOLATION_PATTERN,
  { include: scopeName },
];
