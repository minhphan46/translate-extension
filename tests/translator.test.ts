import { vi } from "vitest";
import { translateSelection } from "../src/background/translator";
import * as openaiModule from "../src/background/openai";
import * as storageModule from "../src/shared/storage";

describe("translateSelection", () => {
  it("uses fallback translation for Vietnamese to English when AI options are disabled", async () => {
    vi.spyOn(storageModule.extensionStorage, "getSettings").mockResolvedValue({
      keys: [{ id: "1", label: "Main", apiKey: "sk-1", createdAt: new Date().toISOString() }],
      activeKeyId: "1",
      model: storageModule.DEFAULT_MODEL,
      promptTemplate: "",
      enableAiVietnameseToEnglishOptions: false
    });
    vi.spyOn(openaiModule, "translateVietnameseToEnglish").mockResolvedValue(["should not be used"]);
    vi.spyOn(global, "fetch").mockResolvedValue({
      ok: true,
      json: async () => [[["Healing music helps you relax."]]]
    } as Response);

    const result = await translateSelection("Nhạc chữa bệnh giúp thư giãn");

    expect(result.translatedOptions).toEqual(["Healing music helps you relax."]);
    expect(openaiModule.translateVietnameseToEnglish).not.toHaveBeenCalled();
  });

  it("uses fallback translation for Vietnamese to English when API key is missing", async () => {
    vi.spyOn(storageModule.extensionStorage, "getSettings").mockResolvedValue({
      keys: [],
      activeKeyId: "",
      model: storageModule.DEFAULT_MODEL,
      promptTemplate: "",
      enableAiVietnameseToEnglishOptions: true
    });
    vi.spyOn(openaiModule, "translateVietnameseToEnglish").mockResolvedValue(["should not be used"]);
    vi.spyOn(global, "fetch").mockResolvedValue({
      ok: true,
      json: async () => [[["Healing music helps you relax."]]]
    } as Response);

    const result = await translateSelection("Nhạc chữa bệnh giúp thư giãn");

    expect(result.translatedOptions).toEqual(["Healing music helps you relax."]);
    expect(openaiModule.translateVietnameseToEnglish).not.toHaveBeenCalled();
  });

  it("uses OpenAI options when enabled and API key exists", async () => {
    vi.spyOn(storageModule.extensionStorage, "getSettings").mockResolvedValue({
      keys: [{ id: "1", label: "Main", apiKey: "sk-1", createdAt: new Date().toISOString() }],
      activeKeyId: "1",
      model: storageModule.DEFAULT_MODEL,
      promptTemplate: "",
      enableAiVietnameseToEnglishOptions: true
    });
    vi.spyOn(openaiModule, "translateVietnameseToEnglish").mockResolvedValue([
      "Option one",
      "Option two",
      "Option three"
    ]);

    const result = await translateSelection("Nhạc chữa bệnh giúp thư giãn");

    expect(result.translatedText).toBe("Option one");
    expect(result.translatedOptions).toHaveLength(3);
    expect(openaiModule.translateVietnameseToEnglish).toHaveBeenCalled();
  });
});
