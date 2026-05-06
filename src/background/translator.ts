import { detectTranslationDirection } from "../shared/language";
import { extensionStorage } from "../shared/storage";
import type { TranslationResult } from "../shared/types";
import { translateVietnameseToEnglish } from "./openai";

async function translateForeignToVietnamese(text: string): Promise<string> {
  const endpoint = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=vi&dt=t&q=${encodeURIComponent(
    text
  )}`;
  const response = await fetch(endpoint);

  if (!response.ok) {
    throw new Error(`Google translate request failed: ${response.status}`);
  }

  const payload = (await response.json()) as unknown;
  const translatedText = Array.isArray(payload)
    ? (payload[0] as Array<[string]> | undefined)?.map((item) => item[0]).join("")
    : "";

  if (!translatedText) {
    throw new Error("Unable to translate selected text to Vietnamese.");
  }

  return translatedText;
}

async function translateVietnameseToEnglishFallback(text: string): Promise<string> {
  const endpoint = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=vi&tl=en&dt=t&q=${encodeURIComponent(
    text
  )}`;
  const response = await fetch(endpoint);

  if (!response.ok) {
    throw new Error(`Google translate request failed: ${response.status}`);
  }

  const payload = (await response.json()) as unknown;
  const translatedText = Array.isArray(payload)
    ? (payload[0] as Array<[string]> | undefined)?.map((item) => item[0]).join("")
    : "";

  if (!translatedText) {
    throw new Error("Unable to translate selected text to English.");
  }

  return translatedText;
}

export async function translateSelection(text: string): Promise<TranslationResult> {
  const direction = detectTranslationDirection(text);

  if (direction === "unknown") {
    throw new Error("Unable to detect source language.");
  }

  if (direction === "foreign-to-vi") {
    const translatedText = await translateForeignToVietnamese(text);
    return {
      originalText: text,
      translatedText,
      translatedOptions: [translatedText],
      direction
    };
  }

  const settings = await extensionStorage.getSettings();
  const hasActiveKey =
    settings.keys.some((item) => item.id === settings.activeKeyId && item.apiKey.trim()) ||
    settings.keys.some((item) => item.apiKey.trim());

  if (!settings.enableAiVietnameseToEnglishOptions || !hasActiveKey) {
    const translatedText = await translateVietnameseToEnglishFallback(text);
    return {
      originalText: text,
      translatedText,
      translatedOptions: [translatedText],
      direction
    };
  }

  const translatedOptions = await translateVietnameseToEnglish(text, settings);

  return {
    originalText: text,
    translatedText: translatedOptions[0],
    translatedOptions,
    direction
  };
}
