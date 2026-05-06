export type TranslationDirection = "vi-to-en" | "foreign-to-vi" | "unknown";

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
  direction: TranslationDirection;
}
