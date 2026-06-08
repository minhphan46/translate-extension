import { buildOpenAIPrompt } from "../src/shared/prompt";

describe("buildOpenAIPrompt", () => {
  it("uses fallback template when user template empty", () => {
    const prompt = buildOpenAIPrompt("", "xin chao");
    expect(prompt).toContain("3 natural English translation options");
    expect(prompt).toContain("Preserve the original formatting exactly");
    expect(prompt).toContain("<option>...</option>");
    expect(prompt).toContain("xin chao");
  });

  it("injects source text into custom template", () => {
    const prompt = buildOpenAIPrompt("Translate: {{text}}", "xin chao");
    expect(prompt).toBe("Translate: xin chao");
  });
});
