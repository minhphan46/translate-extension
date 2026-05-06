import { extractTranslationOptions } from "../src/shared/options-parser";

describe("extractTranslationOptions", () => {
  it("parses numbered options", () => {
    const content = "1. Hello there\n2. Hi there\n3. Greetings";
    expect(extractTranslationOptions(content)).toEqual(["Hello there", "Hi there", "Greetings"]);
  });

  it("falls back to non-empty lines", () => {
    const content = "Hello there\n\nHi there";
    expect(extractTranslationOptions(content)).toEqual(["Hello there", "Hi there"]);
  });
});
