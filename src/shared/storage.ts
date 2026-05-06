import type { ExtensionSettings } from "./types";

export const STORAGE_KEY = "translate-extension-settings";
export const DEFAULT_MODEL = "gpt-4.1-mini";

const DEFAULT_SETTINGS: ExtensionSettings = {
  keys: [],
  activeKeyId: "",
  model: DEFAULT_MODEL,
  promptTemplate: "",
  enableAiVietnameseToEnglishOptions: false
};

export const extensionStorage = {
  async getSettings(): Promise<ExtensionSettings> {
    const result = await chrome.storage.local.get({
      [STORAGE_KEY]: DEFAULT_SETTINGS
    });

    return { ...DEFAULT_SETTINGS, ...(result[STORAGE_KEY] as ExtensionSettings | undefined) };
  },

  async saveSettings(settings: ExtensionSettings): Promise<void> {
    await chrome.storage.local.set({
      [STORAGE_KEY]: settings
    });
  }
};
