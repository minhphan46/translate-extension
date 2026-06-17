import type { ExtensionSettings } from "./types";

export const STORAGE_KEY = "translate-extension-settings";
export const DEFAULT_MODEL = "gpt-4.1-mini";
export const DEFAULT_GEMINI_MODEL = "gemini-2.5-flash";
export const OPENAI_MODELS = ["gpt-4.1-mini", "gpt-4.1", "gpt-4.1-nano"];
export const GEMINI_MODELS = [
  "gemini-2.5-flash",
  "gemini-2.5-flash-lite",
  "gemini-2.5-pro",
  "gemini-3-flash-preview",
  "gemini-3.5-flash"
];

const DEFAULT_SETTINGS: ExtensionSettings = {
  keys: [],
  activeKeyId: "",
  model: DEFAULT_MODEL,
  aiProvider: "openai",
  geminiKeys: [],
  activeGeminiKeyId: "",
  geminiApiKey: "",
  geminiModel: DEFAULT_GEMINI_MODEL,
  promptTemplate: "",
  enableAiVietnameseToEnglishOptions: false,
  overlayTheme: "white",
  ttsRate: 1.0,
  ttsVoiceVi: "",
  ttsVolume: 1.0,
  popupWidth: 500,
  fontSize: 13
};

function normalizeSettings(settings: ExtensionSettings): ExtensionSettings {
  const legacyGeminiKey = settings.geminiApiKey.trim();
  const geminiKeys =
    settings.geminiKeys.length || !legacyGeminiKey
      ? settings.geminiKeys
      : [
          {
            id: "legacy-gemini-key",
            label: "Gemini Key",
            apiKey: legacyGeminiKey,
            createdAt: new Date(0).toISOString()
          }
        ];

  const activeGeminiKeyId =
    settings.activeGeminiKeyId || geminiKeys[0]?.id || "";
  const activeGeminiKey =
    geminiKeys.find((item) => item.id === activeGeminiKeyId) ?? geminiKeys[0] ?? null;

  return {
    ...settings,
    geminiKeys,
    activeGeminiKeyId,
    geminiApiKey: activeGeminiKey?.apiKey ?? legacyGeminiKey
  };
}

export const extensionStorage = {
  async getSettings(): Promise<ExtensionSettings> {
    const result = await chrome.storage.local.get({
      [STORAGE_KEY]: DEFAULT_SETTINGS
    });

    return normalizeSettings({
      ...DEFAULT_SETTINGS,
      ...(result[STORAGE_KEY] as Partial<ExtensionSettings> | undefined)
    });
  },

  async saveSettings(settings: ExtensionSettings): Promise<void> {
    await chrome.storage.local.set({
      [STORAGE_KEY]: settings
    });
  }
};
