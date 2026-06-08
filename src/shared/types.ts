export type TranslationDirection = "vi-to-en" | "foreign-to-vi" | "unknown";
export type TranslationOptionSource = "google" | "gpt";

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
  promptTemplate: string;
  enableAiVietnameseToEnglishOptions: boolean;
}

export interface TranslationResult {
  originalText: string;
  translatedText: string;
  translatedOptions?: string[];
  translationOptions?: TranslationOption[];
  direction: TranslationDirection;
}

export interface TranslationOption {
  text: string;
  source?: TranslationOptionSource;
  label?: string;
}
