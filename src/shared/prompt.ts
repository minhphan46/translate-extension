const DEFAULT_PROMPT_TEMPLATE = [
  "Translate following Vietnamese text into 3 natural English translation options.",
  "Keep tone close to original.",
  "Return each option on separate numbered line.",
  "",
  "Text: {{text}}"
].join("\n");

export function buildOpenAIPrompt(template: string, sourceText: string): string {
  const effectiveTemplate = template.trim() || DEFAULT_PROMPT_TEMPLATE;
  return effectiveTemplate.replaceAll("{{text}}", sourceText);
}

export { DEFAULT_PROMPT_TEMPLATE };
