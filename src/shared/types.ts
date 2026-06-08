export type TranslationDirection = "vi-to-en" | "foreign-to-vi" | "unknown";
export type TranslationAiProvider = "openai" | "gemini";
export type TranslationOptionSource = "google" | "gpt" | "gemini";
export type OverlayTheme = "transparent" | "white";

export interface ApiKeyRecord {
  id: string;
  label: string;
  apiKey: string;
  createdAt: string;
}

export interface ExtensionSettings {
  keys: ApiKeyRecord[];
  activeKeyId: string;
  model: string;
  aiProvider: TranslationAiProvider;
  geminiKeys: ApiKeyRecord[];
  activeGeminiKeyId: string;
  geminiApiKey: string;
  geminiModel: string;
  promptTemplate: string;
  enableAiVietnameseToEnglishOptions: boolean;
  overlayTheme: OverlayTheme;
}

export interface TranslationResult {
  originalText: string;
  translatedText: string;
  translatedOptions?: string[];
  translationOptions?: TranslationOption[];
  pendingAiProvider?: TranslationAiProvider;
  aiError?: string;
  direction: TranslationDirection;
}

export interface TranslationOption {
  text: string;
  source?: TranslationOptionSource;
  label?: string;
}
