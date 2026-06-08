import type { ExtensionSettings, TranslationResult } from "./types";

export type RuntimeMessage =
  | { type: "TRANSLATE_SELECTION"; payload: { text: string; requestId?: string } }
  | { type: "TRANSLATION_PARTIAL"; payload: { requestId: string; result: TranslationResult } }
  | { type: "OPEN_OPTIONS" }
  | { type: "SETTINGS_UPDATED"; payload: ExtensionSettings };

export type RuntimeResponse =
  | { ok: true; data?: TranslationResult | null }
  | { ok: false; error: string };
