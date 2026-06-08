import { DEFAULT_GEMINI_MODEL, DEFAULT_MODEL, extensionStorage } from "../src/shared/storage";

const storageState = new Map<string, unknown>();

beforeEach(() => {
  storageState.clear();
  global.chrome = {
    storage: {
      local: {
        get: vi.fn(async (keys?: string | string[] | Record<string, unknown>) => {
          if (typeof keys === "string") {
            return { [keys]: storageState.get(keys) };
          }

          if (Array.isArray(keys)) {
            return Object.fromEntries(keys.map((key) => [key, storageState.get(key)]));
          }

          if (keys && typeof keys === "object") {
            return Object.fromEntries(
              Object.entries(keys).map(([key, fallback]) => [key, storageState.get(key) ?? fallback])
            );
          }

          return Object.fromEntries(storageState.entries());
        }),
        set: vi.fn(async (payload: Record<string, unknown>) => {
          Object.entries(payload).forEach(([key, value]) => storageState.set(key, value));
        })
      }
    }
  } as unknown as typeof chrome;
});

describe("extensionStorage", () => {
  it("returns sensible defaults with empty storage", async () => {
    const settings = await extensionStorage.getSettings();
    expect(settings.model).toBe(DEFAULT_MODEL);
    expect(settings.aiProvider).toBe("openai");
    expect(settings.geminiKeys).toEqual([]);
    expect(settings.activeGeminiKeyId).toBe("");
    expect(settings.geminiApiKey).toBe("");
    expect(settings.geminiModel).toBe(DEFAULT_GEMINI_MODEL);
    expect(settings.promptTemplate).toBe("");
    expect(settings.keys).toEqual([]);
    expect(settings.enableAiVietnameseToEnglishOptions).toBe(false);
  });

  it("adds api key to collection", async () => {
    await extensionStorage.saveSettings({
      activeKeyId: "",
      keys: [{ id: "1", label: "Main", apiKey: "sk-1" }],
      model: DEFAULT_MODEL,
      aiProvider: "gemini",
      geminiKeys: [{ id: "g1", label: "Gemini Main", apiKey: "gemini-key", createdAt: "2026-01-01" }],
      activeGeminiKeyId: "g1",
      geminiApiKey: "gemini-key",
      geminiModel: DEFAULT_GEMINI_MODEL,
      promptTemplate: "",
      enableAiVietnameseToEnglishOptions: true
    });

    const settings = await extensionStorage.getSettings();
    expect(settings.keys).toHaveLength(1);
    expect(settings.keys[0].apiKey).toBe("sk-1");
    expect(settings.aiProvider).toBe("gemini");
    expect(settings.geminiKeys).toHaveLength(1);
    expect(settings.geminiKeys[0].label).toBe("Gemini Main");
    expect(settings.activeGeminiKeyId).toBe("g1");
    expect(settings.geminiApiKey).toBe("gemini-key");
  });
});
