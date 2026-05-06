import { detectTranslationDirection } from "../src/shared/language";

describe("detectTranslationDirection", () => {
  it("detects Vietnamese text when diacritics appear", () => {
    expect(detectTranslationDirection("Tôi muốn học tiếng anh")).toBe("vi-to-en");
  });

  it("detects English text for latin sentence", () => {
    expect(detectTranslationDirection("I want to improve my communication skills")).toBe(
      "foreign-to-vi"
    );
  });

  it("detects non-English foreign text for translation into Vietnamese", () => {
    expect(detectTranslationDirection("Hola, me llamo Ana")).toBe("foreign-to-vi");
  });

  it("returns unknown for empty content", () => {
    expect(detectTranslationDirection("   ")).toBe("unknown");
  });
});
