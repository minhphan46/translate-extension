export function extractTranslationOptions(content: string): string[] {
  const numbered = content
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => line.replace(/^\d+[\).\s-]*/u, "").trim())
    .filter(Boolean);

  return numbered;
}
