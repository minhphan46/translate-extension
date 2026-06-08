const DEFAULT_PROMPT_TEMPLATE = [
  "Translate following Vietnamese text into 3 natural English translation options.",
  "Keep tone close to original.",
  "Preserve the original formatting exactly, including line breaks, blank lines, indentation, bullets, numbered lists, and row order.",
  "Return each option wrapped in its own <option>...</option> block.",
  "Do not add extra commentary outside the option blocks.",
  "",
  "Text: {{text}}"
].join("\n");

export function buildOpenAIPrompt(template: string, sourceText: string): string {
  const effectiveTemplate = template.trim() || DEFAULT_PROMPT_TEMPLATE;
  return effectiveTemplate.replaceAll("{{text}}", sourceText);
}

export { DEFAULT_PROMPT_TEMPLATE };
