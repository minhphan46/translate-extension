import type { RuntimeMessage, RuntimeResponse } from "../shared/messages";
import type { TranslationOption, TranslationResult } from "../shared/types";
import { createTranslationOverlay } from "./overlay";
import "./content.css";

let activeOverlay: ReturnType<typeof createTranslationOverlay> | null = null;
let activeTranslationRequestId: string | null = null;
let activeUtterance: SpeechSynthesisUtterance | null = null;
let activeSpeechTarget: "original" | "translation" | null = null;
let isShiftPressed = false;
let isStandaloneShiftPress = false;
const LOG_PREFIX = "[Translate Extension]";
const VIETNAMESE_PATTERN =
  /[ăâđêôơưàáạảãằắặẳẵầấậẩẫèéẹẻẽềếệểễìíịỉĩòóọỏõồốộổỗờớợởỡùúụủũừứựửữỳýỵỷỹ]/i;
const LETTER_PATTERN = /\p{L}/u;

function debugLog(message: string, payload?: unknown): void {
  if (payload === undefined) {
    console.log(LOG_PREFIX, message);
    return;
  }

  console.log(LOG_PREFIX, message, payload);
}

function detectSelectionDirection(text: string): TranslationResult["direction"] {
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

function destroyOverlay(): void {
  stopSpeaking();
  activeOverlay?.destroy();
  activeOverlay = null;
  activeTranslationRequestId = null;
}

function getSelectedText(): string {
  const windowSelection = window.getSelection()?.toString().trim() ?? "";
  if (windowSelection) {
    return windowSelection;
  }

  const activeElement = document.activeElement;
  if (
    activeElement instanceof HTMLInputElement ||
    activeElement instanceof HTMLTextAreaElement
  ) {
    const start = activeElement.selectionStart ?? 0;
    const end = activeElement.selectionEnd ?? 0;
    return activeElement.value.slice(start, end).trim();
  }

  return "";
}

function getSelectionRect(): DOMRect | null {
  const selection = window.getSelection();

  if (!selection || selection.rangeCount === 0 || selection.isCollapsed) {
    return null;
  }

  const range = selection.getRangeAt(0);
  const rect = range.getBoundingClientRect();

  if (rect.width || rect.height) {
    return rect;
  }

  const clientRect = range.getClientRects()[0];
  if (clientRect) {
    return clientRect;
  }

  const activeElement = document.activeElement;
  if (
    activeElement instanceof HTMLInputElement ||
    activeElement instanceof HTMLTextAreaElement
  ) {
    return activeElement.getBoundingClientRect();
  }

  return null;
}

function stopSpeaking(): void {
  window.speechSynthesis.cancel();
  activeUtterance = null;
  activeSpeechTarget = null;
  activeOverlay?.setSpeaking(null);
}

function speakText(id: "original" | "translation", text: string, lang: string): void {
  if (activeSpeechTarget === id && window.speechSynthesis.speaking) {
    debugLog("Stopping active speech", { id });
    stopSpeaking();
    return;
  }

  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = lang;
  utterance.onend = () => {
    debugLog("Speech ended", { id });
    if (activeUtterance === utterance) {
      activeUtterance = null;
      activeSpeechTarget = null;
      activeOverlay?.setSpeaking(null);
    }
  };
  utterance.onerror = () => {
    debugLog("Speech failed", { id });
    if (activeUtterance === utterance) {
      activeUtterance = null;
      activeSpeechTarget = null;
      activeOverlay?.setSpeaking(null);
    }
  };
  activeUtterance = utterance;
  activeSpeechTarget = id;
  activeOverlay?.setSpeaking(id);
  window.speechSynthesis.speak(utterance);
}

function createRequestId(): string {
  return globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random()}`;
}

function getRenderableOptions(result: TranslationResult): TranslationOption[] {
  if (result.translationOptions?.length) {
    return result.translationOptions;
  }

  return (result.translatedOptions ?? [result.translatedText]).map((text) => ({ text }));
}

function hasGptOption(options: TranslationOption[]): boolean {
  return options.some((option) => option.source === "gpt");
}

function renderTranslationResult(result: TranslationResult, showGptLoading = false): void {
  activeOverlay?.setTranslations(
    getRenderableOptions(result),
    showGptLoading ? "GPT is translating..." : undefined
  );
}

async function requestTranslation(text: string, requestId: string): Promise<TranslationResult> {
  debugLog("Sending translation request", { textLength: text.length, preview: text.slice(0, 80) });
  const response = (await chrome.runtime.sendMessage({
    type: "TRANSLATE_SELECTION",
    payload: { text, requestId }
  } satisfies RuntimeMessage)) as RuntimeResponse;

  if (!response.ok || !response.data) {
    debugLog("Translation request failed", response);
    throw new Error(response.ok ? "Empty translation response." : response.error);
  }

  debugLog("Translation request success", {
    direction: response.data.direction,
    optionCount: response.data.translationOptions?.length ?? response.data.translatedOptions?.length ?? 1
  });
  return response.data;
}

function mountLoadingOverlay(
  originalText: string,
  anchorRect: DOMRect,
  direction: TranslationResult["direction"]
): ReturnType<typeof createTranslationOverlay> {
  destroyOverlay();
  debugLog("Mounting loading overlay", {
    anchorRect: {
      top: anchorRect.top,
      left: anchorRect.left,
      right: anchorRect.right,
      bottom: anchorRect.bottom,
      width: anchorRect.width,
      height: anchorRect.height
    }
  });

  activeOverlay = createTranslationOverlay({
    originalText,
    direction,
    anchorRect,
    onCopy: async (value) => navigator.clipboard.writeText(value),
    onOpenSettings: () => {
      void chrome.runtime.sendMessage({ type: "OPEN_OPTIONS" } satisfies RuntimeMessage);
    },
    onSpeakToggle: ({ id, value, lang }) => {
      speakText(id, value, lang);
    }
  });

  activeOverlay.setLoading("Loading translation...");
  document.body.appendChild(activeOverlay.element);
  return activeOverlay;
}

async function handleShortcut(): Promise<void> {
  debugLog("Shift detected");
  const selectedText = getSelectedText();
  const anchorRect = getSelectionRect();
  debugLog("Selection snapshot", {
    selectedText,
    textLength: selectedText.length,
    anchorRect: anchorRect
      ? {
          top: anchorRect.top,
          left: anchorRect.left,
          right: anchorRect.right,
          bottom: anchorRect.bottom,
          width: anchorRect.width,
          height: anchorRect.height
        }
      : null,
    activeElement: document.activeElement?.tagName ?? null,
    url: window.location.href
  });

  if (!selectedText) {
    debugLog("No selected text. Overlay not shown.");
    destroyOverlay();
    return;
  }

  if (!anchorRect) {
    debugLog("No selection rect. Overlay not shown.");
    destroyOverlay();
    return;
  }

  try {
    const requestId = createRequestId();
    const overlay = mountLoadingOverlay(
      selectedText,
      anchorRect,
      detectSelectionDirection(selectedText)
    );
    activeTranslationRequestId = requestId;
    const result = await requestTranslation(selectedText, requestId);
    if (activeTranslationRequestId === requestId && activeOverlay === overlay) {
      renderTranslationResult(result);
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Translate failed.";
    debugLog("Handle shortcut failed", { message });
    activeOverlay?.setError(message);
  }
}

chrome.runtime.onMessage?.addListener?.((message: RuntimeMessage) => {
  if (message.type !== "TRANSLATION_PARTIAL") {
    return;
  }

  if (message.payload.requestId !== activeTranslationRequestId) {
    debugLog("Ignoring stale translation partial", { requestId: message.payload.requestId });
    return;
  }

  debugLog("Translation partial received", {
    requestId: message.payload.requestId,
    optionCount:
      message.payload.result.translationOptions?.length ??
      message.payload.result.translatedOptions?.length ??
      1
  });
  const options = getRenderableOptions(message.payload.result);
  renderTranslationResult(
    message.payload.result,
    message.payload.result.direction === "vi-to-en" && !hasGptOption(options)
  );
});

window.addEventListener("keydown", (event) => {
  if (event.key === "Shift") {
    if (event.repeat) {
      return;
    }

    isShiftPressed = true;
    isStandaloneShiftPress = !event.altKey && !event.ctrlKey && !event.metaKey;
    debugLog("shift keydown captured", {
      key: event.key,
      target: (event.target as HTMLElement | null)?.tagName ?? null,
      defaultPrevented: event.defaultPrevented,
      isStandaloneShiftPress
    });
    return;
  }

  if (!isShiftPressed) {
    return;
  }

  isStandaloneShiftPress = false;
  debugLog("shift shortcut cancelled by secondary key", {
    key: event.key,
    target: (event.target as HTMLElement | null)?.tagName ?? null,
    defaultPrevented: event.defaultPrevented
  });
}, true);

window.addEventListener("keyup", (event) => {
  if (event.key !== "Shift") {
    return;
  }

  const shouldHandleShortcut = isShiftPressed && isStandaloneShiftPress;
  isShiftPressed = false;
  isStandaloneShiftPress = false;

  debugLog("shift keyup captured", {
    key: event.key,
    target: (event.target as HTMLElement | null)?.tagName ?? null,
    defaultPrevented: event.defaultPrevented,
    shouldHandleShortcut
  });

  if (!shouldHandleShortcut) {
    return;
  }

  void handleShortcut();
}, true);

document.addEventListener("mousedown", (event) => {
  const target = event.target as HTMLElement | null;
  if (!target?.closest(".translate-extension-root")) {
    destroyOverlay();
  }
});

debugLog("Content script ready", { url: window.location.href });
