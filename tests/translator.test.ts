import { vi } from "vitest";
import { translateSelection } from "../src/background/translator";
import * as geminiModule from "../src/background/gemini";
import * as openaiModule from "../src/background/openai";
import * as storageModule from "../src/shared/storage";
import type { ExtensionSettings } from "../src/shared/types";

function createSettings(overrides: Partial<ExtensionSettings> = {}): ExtensionSettings {
  return {
    keys: [{ id: "1", label: "Main", apiKey: "sk-1", createdAt: new Date().toISOString() }],
    activeKeyId: "1",
    model: storageModule.DEFAULT_MODEL,
    aiProvider: "openai" as const,
    geminiKeys: [],
    activeGeminiKeyId: "",
    geminiApiKey: "",
    geminiModel: storageModule.DEFAULT_GEMINI_MODEL,
    promptTemplate: "",
    enableAiVietnameseToEnglishOptions: true,
    ...overrides
  };
}

describe("translateSelection", () => {
  it("uses fallback translation for Vietnamese to English when AI options are disabled", async () => {
    vi.spyOn(storageModule.extensionStorage, "getSettings").mockResolvedValue(createSettings({
      enableAiVietnameseToEnglishOptions: false
    }));
    vi.spyOn(openaiModule, "translateVietnameseToEnglish").mockResolvedValue(["should not be used"]);
    vi.spyOn(global, "fetch").mockResolvedValue({
      ok: true,
      json: async () => [[["Healing music helps you relax."]]]
    } as Response);

    const result = await translateSelection("Nhạc chữa bệnh giúp thư giãn");

    expect(result.translatedOptions).toEqual(["Healing music helps you relax."]);
    expect(openaiModule.translateVietnameseToEnglish).not.toHaveBeenCalled();
  });

  it("preserves line breaks and indentation in Google fallback translations", async () => {
    vi.spyOn(storageModule.extensionStorage, "getSettings").mockResolvedValue(createSettings({
      enableAiVietnameseToEnglishOptions: false
    }));
    vi.spyOn(global, "fetch").mockImplementation(async (input: RequestInfo | URL) => {
      const url = new URL(String(input));
      const sourceText = url.searchParams.get("q");
      const translations: Record<string, string> = {
        "- dòng một": "- line one",
        "dòng hai": "line two"
      };

      return {
        ok: true,
        json: async () => [[[translations[sourceText ?? ""] ?? sourceText ?? ""]]]
      } as Response;
    });

    const result = await translateSelection("  - dòng một\n\tdòng hai");

    expect(result.translatedOptions).toEqual(["  - line one\n\tline two"]);
  });

  it("uses fallback translation for Vietnamese to English when API key is missing", async () => {
    vi.spyOn(storageModule.extensionStorage, "getSettings").mockResolvedValue(createSettings({
      keys: [],
      activeKeyId: ""
    }));
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
    vi.spyOn(storageModule.extensionStorage, "getSettings").mockResolvedValue(createSettings());
    vi.spyOn(global, "fetch").mockResolvedValue({
      ok: true,
      json: async () => [[["Google option"]]]
    } as Response);
    vi.spyOn(openaiModule, "translateVietnameseToEnglish").mockResolvedValue([
      "Option one",
      "Option two",
      "Option three"
    ]);

    const result = await translateSelection("Nhạc chữa bệnh giúp thư giãn");

    expect(result.translatedText).toBe("Google option");
    expect(result.translatedOptions).toEqual([
      "Google option",
      "Option one",
      "Option two",
      "Option three"
    ]);
    expect(result.translationOptions?.map((option) => option.source)).toEqual([
      "google",
      "gpt",
      "gpt",
      "gpt"
    ]);
    expect(openaiModule.translateVietnameseToEnglish).toHaveBeenCalled();
  });

  it("includes AI error when OpenAI fails but Google succeeds", async () => {
    vi.spyOn(storageModule.extensionStorage, "getSettings").mockResolvedValue(createSettings());
    vi.spyOn(global, "fetch").mockResolvedValue({
      ok: true,
      json: async () => [[["Google option"]]]
    } as Response);
    vi.spyOn(openaiModule, "translateVietnameseToEnglish").mockRejectedValue(
      new Error("OpenAI quota exceeded")
    );

    const result = await translateSelection("Nhạc chữa bệnh giúp thư giãn");

    expect(result.translatedOptions).toEqual(["Google option"]);
    expect(result.aiError).toBe("GPT error: OpenAI quota exceeded");
  });

  it("uses Gemini options when Gemini provider is selected", async () => {
    vi.spyOn(storageModule.extensionStorage, "getSettings").mockResolvedValue(
      createSettings({
        aiProvider: "gemini",
        geminiKeys: [{ id: "g1", label: "Gemini Main", apiKey: "gemini-key", createdAt: "2026-01-01" }],
        activeGeminiKeyId: "g1",
        geminiApiKey: "gemini-key"
      })
    );
    vi.spyOn(global, "fetch").mockResolvedValue({
      ok: true,
      json: async () => [[["Google option"]]]
    } as Response);
    vi.spyOn(openaiModule, "translateVietnameseToEnglish").mockResolvedValue(["should not be used"]);
    vi.spyOn(geminiModule, "translateVietnameseToEnglishWithGemini").mockResolvedValue([
      "Gemini one",
      "Gemini two"
    ]);

    const result = await translateSelection("Nhạc chữa bệnh giúp thư giãn");

    expect(result.translatedOptions).toEqual(["Google option", "Gemini one", "Gemini two"]);
    expect(result.translationOptions?.map((option) => option.source)).toEqual([
      "google",
      "gemini",
      "gemini"
    ]);
    expect(geminiModule.translateVietnameseToEnglishWithGemini).toHaveBeenCalled();
    expect(openaiModule.translateVietnameseToEnglish).not.toHaveBeenCalled();
  });
});
