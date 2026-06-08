import { detectTranslationDirection } from "../shared/language";
import { extensionStorage } from "../shared/storage";
import type { TranslationAiProvider, TranslationOption, TranslationResult } from "../shared/types";
import { translateVietnameseToEnglishWithGemini } from "./gemini";
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

async function translateWithGooglePreservingLines(
  text: string,
  sourceLanguage: "auto" | "vi",
  targetLanguage: "vi" | "en",
  emptyMessage: string
): Promise<string> {
  const parts = text.split(/(\r\n|\n|\r)/u);
  const translatedParts = await Promise.all(
    parts.map(async (part) => {
      if (part === "\n" || part === "\r" || part === "\r\n" || !part.trim()) {
        return part;
      }

      const whitespace = part.match(/^(\s*)([\s\S]*?)(\s*)$/u);
      const leadingWhitespace = whitespace?.[1] ?? "";
      const textContent = whitespace?.[2] ?? part;
      const trailingWhitespace = whitespace?.[3] ?? "";

      if (!textContent.trim()) {
        return part;
      }

      const translatedText = await translateWithGoogle(
        textContent,
        sourceLanguage,
        targetLanguage,
        emptyMessage
      );
      return `${leadingWhitespace}${translatedText}${trailingWhitespace}`;
    })
  );

  const translatedText = translatedParts.join("");

  if (!translatedText.trim()) {
    throw new Error(emptyMessage);
  }

  return translatedText;
}

async function translateForeignToVietnamese(text: string): Promise<string> {
  return translateWithGooglePreservingLines(
    text,
    "auto",
    "vi",
    "Unable to translate selected text to Vietnamese."
  );
}

async function translateVietnameseToEnglishFallback(text: string): Promise<string> {
  return translateWithGooglePreservingLines(
    text,
    "vi",
    "en",
    "Unable to translate selected text to English."
  );
}

function buildResult(
  originalText: string,
  options: TranslationOption[],
  direction: TranslationResult["direction"],
  pendingAiProvider?: TranslationAiProvider,
  aiError?: string
): TranslationResult {
  const translatedOptions = options.map((option) => option.text);

  return {
    originalText,
    translatedText: translatedOptions[0] ?? "",
    translatedOptions,
    translationOptions: options,
    pendingAiProvider,
    aiError,
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
  const aiProvider = settings.aiProvider ?? "openai";
  const hasOpenAiKey =
    settings.keys.some((item) => item.id === settings.activeKeyId && item.apiKey.trim()) ||
    settings.keys.some((item) => item.apiKey.trim());
  const hasGeminiKey =
    settings.geminiKeys.some(
      (item) => item.id === settings.activeGeminiKeyId && item.apiKey.trim()
    ) ||
    settings.geminiKeys.some((item) => item.apiKey.trim()) ||
    Boolean(settings.geminiApiKey?.trim());
  const hasActiveAiKey = aiProvider === "gemini" ? hasGeminiKey : hasOpenAiKey;

  if (!settings.enableAiVietnameseToEnglishOptions || !hasActiveAiKey) {
    const translatedText = await translateVietnameseToEnglishFallback(text);
    return buildResult(
      text,
      [{ text: translatedText, source: "google", label: "Google Translate" }],
      direction
    );
  }

  const completedOptions: TranslationOption[] = [];
  const errors: string[] = [];
  let aiError = "";
  const aiProviderLabel = aiProvider === "gemini" ? "Gemini" : "GPT";

  const googleTask = translateVietnameseToEnglishFallback(text)
    .then((translatedText): TranslationOption[] => [
      { text: translatedText, source: "google", label: "Google Translate" }
    ])
    .catch((error: unknown) => {
      errors.push(error instanceof Error ? error.message : "Google Translate failed.");
      return [] satisfies TranslationOption[];
    });

  const aiTask = (
    aiProvider === "gemini"
      ? translateVietnameseToEnglishWithGemini(text, settings)
      : translateVietnameseToEnglish(text, settings)
  )
    .then((translatedTexts): TranslationOption[] =>
      translatedTexts.map((translatedText) => ({
        text: translatedText,
        source: aiProvider === "gemini" ? "gemini" : "gpt",
        label: aiProvider === "gemini" ? "Gemini" : "GPT"
      }))
    )
    .catch((error: unknown) => {
      const message =
        error instanceof Error
          ? error.message
          : aiProvider === "gemini"
            ? "Gemini translation failed."
            : "OpenAI translation failed.";
      aiError = `${aiProviderLabel} error: ${message}`;
      errors.push(aiError);
      return [] satisfies TranslationOption[];
    });

  const notifyPartial = (options: TranslationOption[]): void => {
    if (!options.length) {
      return;
    }

    completedOptions.push(...options);
    const hasAiOption = completedOptions.some(
      (option) => option.source === "gpt" || option.source === "gemini"
    );
    onPartial?.(
      buildResult(
        text,
        sortVietnameseToEnglishOptions(completedOptions),
        direction,
        hasAiOption ? undefined : aiProvider
      )
    );
  };

  const [googleOptions, aiOptions] = await Promise.all([
    googleTask.then((options) => {
      notifyPartial(options);
      return options;
    }),
    aiTask.then((options) => {
      notifyPartial(options);
      return options;
    })
  ]);

  const translatedOptions = sortVietnameseToEnglishOptions([...googleOptions, ...aiOptions]);

  if (!translatedOptions.length) {
    throw new Error(errors.join(" ") || "Unable to translate selected text.");
  }

  return buildResult(text, translatedOptions, direction, undefined, aiError || undefined);
}
