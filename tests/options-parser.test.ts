import { extractTranslationOptions } from "../src/shared/options-parser";

describe("extractTranslationOptions", () => {
  it("parses numbered options", () => {
    const content = "1. Hello there\n2. Hi there\n3. Greetings";
    expect(extractTranslationOptions(content)).toEqual(["Hello there", "Hi there", "Greetings"]);
  });

  it("parses tagged multiline options", () => {
    const content = [
      "<option>",
      "- First item",
      "- Second item",
      "</option>",
      "<option>",
      "1. First row",
      "2. Second row",
      "</option>"
    ].join("\n");

    expect(extractTranslationOptions(content)).toEqual([
      "- First item\n- Second item",
      "1. First row\n2. Second row"
    ]);
  });

  it("keeps multiline numbered option blocks together", () => {
    const content = "1. - First item\n- Second item\n2. - Another item\n- Final item";
    expect(extractTranslationOptions(content)).toEqual([
      "- First item\n- Second item",
      "- Another item\n- Final item"
    ]);
  });

  it("falls back to non-empty lines", () => {
    const content = "Hello there\n\nHi there";
    expect(extractTranslationOptions(content)).toEqual(["Hello there", "Hi there"]);
  });
});
