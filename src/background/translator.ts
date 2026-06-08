import { detectTranslationDirection } from "../shared/language";
import { extensionStorage } from "../shared/storage";
import type { TranslationOption, TranslationResult } from "../shared/types";
import { translateVietnameseToEnglish } from "./openai";

export type TranslationPartialListener = (result: TranslationResult) => void;

async function translateWithGoogle(
  text: string,
  sourceLanguage: "auto" | "vi",
  targetLanguage: "vi" | "en",
  emptyMessage: string
): Promise<string> {
  const endpoint = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${sourceLanguage}&tl=${targetLanguage}&dt=t&q=${encodeURIComponent(
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
    throw new Error(emptyMessage);
  }

  return translatedText;
}

async function translateForeignToVietnamese(text: string): Promise<string> {
  return translateWithGoogle(text, "auto", "vi", "Unable to translate selected text to Vietnamese.");
}

async function translateVietnameseToEnglishFallback(text: string): Promise<string> {
  return translateWithGoogle(text, "vi", "en", "Unable to translate selected text to English.");
}

function buildResult(
  originalText: string,
  options: TranslationOption[],
  direction: TranslationResult["direction"]
): TranslationResult {
  const translatedOptions = options.map((option) => option.text);

  return {
    originalText,
    translatedText: translatedOptions[0] ?? "",
    translatedOptions,
    translationOptions: options,
    direction
  };
}

function sortVietnameseToEnglishOptions(options: TranslationOption[]): TranslationOption[] {
  return [...options].sort((a, b) => {
    if (a.source === b.source) {
      return 0;
    }

    if (a.source === "google") {
      return -1;
    }

    if (b.source === "google") {
      return 1;
    }

    return 0;
  });
}

export async function translateSelection(
  text: string,
  onPartial?: TranslationPartialListener
): Promise<TranslationResult> {
  const direction = detectTranslationDirection(text);

  if (direction === "unknown") {
    throw new Error("Unable to detect source language.");
  }

  if (direction === "foreign-to-vi") {
    const translatedText = await translateForeignToVietnamese(text);
    return buildResult(
      text,
      [{ text: translatedText, source: "google", label: "Google Translate" }],
      direction
    );
  }

  const settings = await extensionStorage.getSettings();
  const hasActiveKey =
    settings.keys.some((item) => item.id === settings.activeKeyId && item.apiKey.trim()) ||
    settings.keys.some((item) => item.apiKey.trim());

  if (!settings.enableAiVietnameseToEnglishOptions || !hasActiveKey) {
    const translatedText = await translateVietnameseToEnglishFallback(text);
    return buildResult(
      text,
      [{ text: translatedText, source: "google", label: "Google Translate" }],
      direction
    );
  }

  const completedOptions: TranslationOption[] = [];
  const errors: string[] = [];

  const googleTask = translateVietnameseToEnglishFallback(text)
    .then((translatedText): TranslationOption[] => [
      { text: translatedText, source: "google", label: "Google Translate" }
    ])
    .catch((error: unknown) => {
      errors.push(error instanceof Error ? error.message : "Google Translate failed.");
      return [] satisfies TranslationOption[];
    });

  const gptTask = translateVietnameseToEnglish(text, settings)
    .then((translatedTexts): TranslationOption[] =>
      translatedTexts.map((translatedText) => ({
        text: translatedText,
        source: "gpt",
        label: "GPT"
      }))
    )
    .catch((error: unknown) => {
      errors.push(error instanceof Error ? error.message : "OpenAI translation failed.");
      return [] satisfies TranslationOption[];
    });

  const notifyPartial = (options: TranslationOption[]): void => {
    if (!options.length) {
      return;
    }

    completedOptions.push(...options);
    onPartial?.(buildResult(text, sortVietnameseToEnglishOptions(completedOptions), direction));
  };

  const [googleOptions, gptOptions] = await Promise.all([
    googleTask.then((options) => {
      notifyPartial(options);
      return options;
    }),
    gptTask.then((options) => {
      notifyPartial(options);
      return options;
    })
  ]);

  const translatedOptions = sortVietnameseToEnglishOptions([...googleOptions, ...gptOptions]);

  if (!translatedOptions.length) {
    throw new Error(errors.join(" ") || "Unable to translate selected text.");
  }

  return buildResult(text, translatedOptions, direction);
}
