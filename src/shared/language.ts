import type { TranslationDirection } from "./types";

const VIETNAMESE_PATTERN =
  /[ăâđêôơưàáạảãằắặẳẵầấậẩẫèéẹẻẽềếệểễìíịỉĩòóọỏõồốộổỗờớợởỡùúụủũừứựửữỳýỵỷỹ]/i;
const LETTER_PATTERN = /\p{L}/u;

export function detectTranslationDirection(text: string): TranslationDirection {
  const normalized = text.trim();

  if (!normalized) {
    return "unknown";
  }

  if (VIETNAMESE_PATTERN.test(normalized)) {
    return "vi-to-en";
  }

  if (LETTER_PATTERN.test(normalized)) {
    return "foreign-to-vi";
  }

  return "unknown";
}
