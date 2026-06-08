import createLucideElement from "lucide/dist/esm/createElement.mjs";
import Check from "lucide/dist/esm/icons/check.mjs";
import ClipboardList from "lucide/dist/esm/icons/clipboard-list.mjs";
import Copy from "lucide/dist/esm/icons/copy.mjs";
import Pause from "lucide/dist/esm/icons/pause.mjs";
import Settings from "lucide/dist/esm/icons/settings.mjs";
import Volume2 from "lucide/dist/esm/icons/volume-2.mjs";
import type { OverlayTheme, TranslationDirection, TranslationOption } from "../shared/types";

type RenderableTranslationOption = string | TranslationOption;
type IconName = "volume" | "pause" | "copy" | "copy-all" | "settings" | "check";

interface OverlayParams {
  originalText: string;
  direction: TranslationDirection;
  theme?: OverlayTheme;
  anchorRect: DOMRect;
  onCopy: (value: string) => Promise<void> | void;
  onOpenSettings: () => void;
  onSpeakToggle: (payload: { id: "original" | "translation"; value: string; lang: string }) => void;
}

interface OverlayHandle {
  element: HTMLDivElement;
  getSelectedText: () => string;
  setLoading: (label?: string) => void;
  setTranslations: (
    options: RenderableTranslationOption[],
    pendingLabel?: string,
    errorLabel?: string
  ) => void;
  setError: (message: string) => void;
  setSpeaking: (id: "original" | "translation" | null) => void;
  destroy: () => void;
}

interface PositionBox {
  left: number;
  top: number;
}

const glassBlur = "blur(24px) saturate(170%)";
const controlGlassBlur = "blur(14px) saturate(150%)";

interface OverlayPalette {
  cardBackground: string;
  cardBorder: string;
  cardShadow: string;
  bodyBackground: string;
  panelBackground: string;
  mutedBackground: string;
  selectedBackground: string;
  controlBackground: string;
  border: string;
  controlBorder: string;
  tealBorder: string;
  pendingBorder: string;
  errorBackground: string;
  errorBorder: string;
  controlShadow: string;
  panelShadow: string;
  statusShadow: string;
  optionShadow: string;
  selectedOptionShadow: string;
}

const transparentPalette: OverlayPalette = {
  cardBackground:
    "linear-gradient(145deg, rgba(255, 255, 255, 0.18) 0%, rgba(241, 245, 249, 0.06) 100%)",
  cardBorder: "0",
  cardShadow: "0 28px 90px rgba(15, 23, 42, 0.12), inset 0 1px 0 rgba(255, 255, 255, 0.12)",
  bodyBackground: "rgba(255, 255, 255, 0.02)",
  panelBackground:
    "linear-gradient(145deg, rgba(255, 255, 255, 0.16) 0%, rgba(248, 250, 252, 0.07) 100%)",
  mutedBackground:
    "linear-gradient(145deg, rgba(248, 250, 252, 0.14) 0%, rgba(226, 232, 240, 0.06) 100%)",
  selectedBackground:
    "linear-gradient(145deg, rgba(236, 254, 255, 0.26) 0%, rgba(240, 253, 250, 0.1) 100%)",
  controlBackground: "rgba(255, 255, 255, 0.16)",
  border: "1px solid rgba(148, 163, 184, 0.16)",
  controlBorder: "1px solid rgba(148, 163, 184, 0.18)",
  tealBorder: "1px solid rgba(45, 212, 191, 0.42)",
  pendingBorder: "1px dashed rgba(94, 234, 212, 0.58)",
  errorBackground:
    "linear-gradient(145deg, rgba(255, 241, 242, 0.26) 0%, rgba(255, 228, 230, 0.1) 100%)",
  errorBorder: "1px solid rgba(248, 113, 113, 0.26)",
  controlShadow: "0 10px 24px rgba(15, 23, 42, 0.05), inset 0 1px 0 rgba(255, 255, 255, 0.18)",
  panelShadow: "inset 0 1px 0 rgba(255, 255, 255, 0.14)",
  statusShadow: "inset 0 1px 0 rgba(255, 255, 255, 0.12)",
  optionShadow: "0 8px 20px rgba(15, 23, 42, 0.03), inset 0 1px 0 rgba(255, 255, 255, 0.12)",
  selectedOptionShadow:
    "0 12px 28px rgba(20, 184, 166, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.16)"
};

const whitePalette: OverlayPalette = {
  cardBackground: "#ffffff",
  cardBorder: "1px solid rgba(226, 232, 240, 0.95)",
  cardShadow: "0 28px 90px rgba(15, 23, 42, 0.22)",
  bodyBackground: "#ffffff",
  panelBackground: "#ffffff",
  mutedBackground: "linear-gradient(180deg, #f8fafc 0%, #f1f5f9 100%)",
  selectedBackground: "linear-gradient(135deg, #ecfeff 0%, #f0fdfa 100%)",
  controlBackground: "#ffffff",
  border: "1px solid #e2e8f0",
  controlBorder: "1px solid #dbe4f0",
  tealBorder: "1px solid #5eead4",
  pendingBorder: "1px dashed #99f6e4",
  errorBackground: "linear-gradient(180deg, #fff1f2 0%, #ffe4e6 100%)",
  errorBorder: "1px solid #fecaca",
  controlShadow: "0 8px 20px rgba(15, 23, 42, 0.06)",
  panelShadow: "inset 0 1px 0 rgba(255, 255, 255, 0.8)",
  statusShadow: "",
  optionShadow: "0 8px 20px rgba(15, 23, 42, 0.05)",
  selectedOptionShadow: "0 12px 28px rgba(20, 184, 166, 0.16)"
};

function getOverlayPalette(theme: OverlayTheme | undefined): OverlayPalette {
  return theme === "white" ? whitePalette : transparentPalette;
}

function applyBackdropGlass(element: HTMLElement, blur = glassBlur): void {
  element.style.setProperty("backdrop-filter", blur);
  element.style.setProperty("-webkit-backdrop-filter", blur);
}

function paintDefaultIconButton(button: HTMLButtonElement, palette: OverlayPalette): void {
  button.style.background = palette.controlBackground;
  button.style.color = "#334155";
  button.style.border = palette.controlBorder;
  button.style.boxShadow = palette.controlShadow;
  applyBackdropGlass(button, controlGlassBlur);
}

function resolveIcon(icon: IconName) {
  if (icon === "volume") {
    return Volume2;
  }

  if (icon === "pause") {
    return Pause;
  }

  if (icon === "copy") {
    return Copy;
  }

  if (icon === "copy-all") {
    return ClipboardList;
  }

  if (icon === "check") {
    return Check;
  }

  return Settings;
}

function iconButton(label: string, icon: IconName, palette: OverlayPalette): HTMLButtonElement {
  const button = document.createElement("button");
  button.type = "button";
  button.setAttribute("aria-label", label);
  button.title = label;
  button.style.appearance = "none";
  button.style.borderRadius = "999px";
  button.style.width = "28px";
  button.style.height = "28px";
  button.style.display = "inline-flex";
  button.style.alignItems = "center";
  button.style.justifyContent = "center";
  button.style.padding = "0";
  button.style.fontSize = "13px";
  button.style.fontWeight = "700";
  button.style.lineHeight = "1";
  button.style.cursor = "pointer";
  button.style.transition = "transform 140ms ease, box-shadow 140ms ease, border-color 140ms ease";
  button.style.opacity = "1";
  button.style.letterSpacing = "0.01em";
  paintDefaultIconButton(button, palette);
  const svg = createLucideElement(resolveIcon(icon), {
    width: 12,
    height: 12,
    stroke: "currentColor",
    "stroke-width": 2,
    class: "translate-extension-icon"
  });
  svg.style.width = "12px";
  svg.style.height = "12px";
  svg.style.pointerEvents = "none";
  button.appendChild(svg);
  return button;
}

function setIcon(button: HTMLButtonElement, icon: IconName): void {
  button.innerHTML = "";
  const svg = createLucideElement(resolveIcon(icon), {
    width: 12,
    height: 12,
    stroke: "currentColor",
    "stroke-width": 2,
    class: "translate-extension-icon"
  });
  svg.style.width = "12px";
  svg.style.height = "12px";
  svg.style.pointerEvents = "none";
  button.appendChild(svg);
}

function clampOverlayPosition(card: HTMLDivElement, position: PositionBox): PositionBox {
  const viewportPadding = 12;
  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;
  const maxCardHeight = Math.max(220, viewportHeight - viewportPadding * 2);

  card.style.maxHeight = `${maxCardHeight}px`;

  const overlayWidth = Math.ceil(card.getBoundingClientRect().width || 500);
  const overlayHeight = Math.ceil(
    card.getBoundingClientRect().height || Math.min(card.scrollHeight, maxCardHeight)
  );

  const left = Math.min(
    Math.max(viewportPadding, position.left),
    Math.max(viewportPadding, viewportWidth - overlayWidth - viewportPadding)
  );
  const top = Math.min(
    Math.max(viewportPadding, position.top),
    Math.max(viewportPadding, viewportHeight - overlayHeight - viewportPadding)
  );

  return { left, top };
}

function positionOverlay(
  root: HTMLDivElement,
  card: HTMLDivElement,
  anchorRect: DOMRect,
  manualPosition?: PositionBox | null
): PositionBox {
  const viewportPadding = 12;
  const gap = 12;
  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;

  if (manualPosition) {
    const clamped = clampOverlayPosition(card, manualPosition);
    root.style.left = `${clamped.left}px`;
    root.style.top = `${clamped.top}px`;
    return clamped;
  }

  const overlayWidth = Math.ceil(card.getBoundingClientRect().width || 500);
  const overlayHeight = Math.ceil(
    card.getBoundingClientRect().height || Math.min(card.scrollHeight, Math.max(220, viewportHeight - viewportPadding * 2))
  );

  let left = anchorRect.right - overlayWidth;
  if (left < viewportPadding) {
    left = anchorRect.left;
  }
  if (left + overlayWidth > viewportWidth - viewportPadding) {
    left = viewportWidth - overlayWidth - viewportPadding;
  }
  left = Math.max(viewportPadding, left);

  let top = anchorRect.top - overlayHeight - gap;
  if (top < viewportPadding) {
    top = anchorRect.bottom + gap;
  }
  if (top + overlayHeight > viewportHeight - viewportPadding) {
    top = Math.max(viewportPadding, viewportHeight - overlayHeight - viewportPadding);
  }

  root.style.left = `${left}px`;
  root.style.top = `${top}px`;
  return { left, top };
}

export function createTranslationOverlay(params: OverlayParams): OverlayHandle {
  const palette = getOverlayPalette(params.theme);
  const root = document.createElement("div");
  root.className = "translate-extension-root";
  root.style.all = "initial";
  root.style.position = "fixed";
  root.style.zIndex = "2147483647";
  root.style.fontFamily = "Manrope, ui-sans-serif, system-ui, sans-serif";
  root.style.opacity = "1";
  root.style.color = "#0f172a";
  root.style.cursor = "default";

  const card = document.createElement("div");
  card.style.width = "500px";
  card.style.display = "flex";
  card.style.flexDirection = "column";
  card.style.overflow = "hidden";
  card.style.borderRadius = "24px";
  card.style.background = palette.cardBackground;
  card.style.opacity = "1";
  card.style.border = palette.cardBorder;
  card.style.boxShadow = palette.cardShadow;
  applyBackdropGlass(card, "blur(30px) saturate(180%)");
  root.appendChild(card);

  const animationStyles = document.createElement("style");
  animationStyles.textContent = `
    @keyframes translate-extension-spin {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }
  `;
  root.appendChild(animationStyles);
  let manualPosition: PositionBox | null = null;
  let isDragging = false;
  let dragOffsetX = 0;
  let dragOffsetY = 0;
  const copyFeedbackTimers = new Map<HTMLButtonElement, number>();
  positionOverlay(root, card, params.anchorRect);

  const body = document.createElement("div");
  body.style.background = palette.bodyBackground;
  body.style.padding = "12px";
  body.style.display = "grid";
  body.style.gap = "10px";
  body.style.overflowY = "auto";
  body.style.overscrollBehavior = "contain";
  card.appendChild(body);

  const originalBlock = document.createElement("div");
  originalBlock.style.borderRadius = "18px";
  originalBlock.style.background = palette.mutedBackground;
  originalBlock.style.padding = "12px";
  originalBlock.style.opacity = "1";
  originalBlock.style.border = palette.border;
  originalBlock.style.boxShadow = palette.panelShadow;
  applyBackdropGlass(originalBlock);
  body.appendChild(originalBlock);

  const originalLabel = document.createElement("div");
  originalLabel.style.display = "flex";
  originalLabel.style.alignItems = "center";
  originalLabel.style.justifyContent = "space-between";
  originalLabel.style.gap = "8px";
  originalLabel.style.marginBottom = "8px";
  originalBlock.appendChild(originalLabel);

  const originalLabelText = document.createElement("span");
  originalLabelText.textContent = "Original";
  originalLabelText.style.fontSize = "11px";
  originalLabelText.style.fontWeight = "800";
  originalLabelText.style.letterSpacing = "0.16em";
  originalLabelText.style.textTransform = "uppercase";
  originalLabelText.style.color = "#64748b";
  originalLabel.appendChild(originalLabelText);

  const originalActions = document.createElement("div");
  originalActions.style.display = "flex";
  originalActions.style.alignItems = "center";
  originalActions.style.gap = "6px";
  originalLabel.appendChild(originalActions);

  const originalText = document.createElement("p");
  originalText.textContent = params.originalText;
  originalText.style.margin = "0";
  originalText.style.fontSize = "13px";
  originalText.style.fontWeight = "700";
  originalText.style.lineHeight = "1.55";
  originalText.style.color = "#0f172a";
  originalText.style.wordBreak = "break-word";
  originalText.style.whiteSpace = "pre-wrap";
  originalBlock.appendChild(originalText);

  let speakingTarget: "original" | "translation" | null = null;

  const speakOriginal = iconButton("Speak original", "volume", palette);
  speakOriginal.addEventListener("click", () => {
    params.onSpeakToggle({
      id: "original",
      value: params.originalText,
      lang: params.direction === "vi-to-en" ? "vi-VN" : "auto"
    });
  });

  const copyOriginal = iconButton("Copy original", "copy", palette);
  copyOriginal.addEventListener("click", async () => {
    await params.onCopy(params.originalText);
    showCopyFeedback(copyOriginal, "Copy original", "copy");
  });

  originalActions.append(speakOriginal, copyOriginal);

  const translatedBlock = document.createElement("div");
  translatedBlock.style.borderRadius = "18px";
  translatedBlock.style.background = palette.panelBackground;
  translatedBlock.style.border = palette.border;
  translatedBlock.style.opacity = "1";
  translatedBlock.style.padding = "12px";
  translatedBlock.style.boxShadow = palette.panelShadow;
  applyBackdropGlass(translatedBlock);
  body.appendChild(translatedBlock);

  const translatedLabel = document.createElement("div");
  translatedLabel.style.display = "flex";
  translatedLabel.style.alignItems = "center";
  translatedLabel.style.justifyContent = "space-between";
  translatedLabel.style.gap = "8px";
  translatedLabel.style.marginBottom = "8px";
  translatedBlock.appendChild(translatedLabel);

  const translatedLabelText = document.createElement("span");
  translatedLabelText.textContent = params.direction === "vi-to-en" ? "English Options" : "Vietnamese";
  translatedLabelText.style.fontSize = "11px";
  translatedLabelText.style.fontWeight = "800";
  translatedLabelText.style.letterSpacing = "0.16em";
  translatedLabelText.style.textTransform = "uppercase";
  translatedLabelText.style.color = "#0f766e";
  translatedLabel.appendChild(translatedLabelText);

  const translatedActions = document.createElement("div");
  translatedActions.style.display = "flex";
  translatedActions.style.alignItems = "center";
  translatedActions.style.gap = "6px";
  translatedLabel.appendChild(translatedActions);

  let selectedText = "";
  let translationTexts: string[] = [];

  const optionsContainer = document.createElement("div");
  optionsContainer.style.display = "grid";
  optionsContainer.style.gap = "8px";
  translatedBlock.appendChild(optionsContainer);

  const statusMessage = document.createElement("div");
  statusMessage.style.borderRadius = "16px";
  statusMessage.style.padding = "10px 12px";
  statusMessage.style.fontSize = "12px";
  statusMessage.style.fontWeight = "700";
  statusMessage.style.lineHeight = "1.5";
  statusMessage.style.background = palette.mutedBackground;
  statusMessage.style.border = palette.border;
  statusMessage.style.color = "#64748b";
  statusMessage.style.boxShadow = palette.statusShadow;
  applyBackdropGlass(statusMessage);
  optionsContainer.appendChild(statusMessage);

  const speakTranslated = iconButton("Speak translation", "volume", palette);
  speakTranslated.addEventListener("click", () => {
    if (!selectedText) {
      return;
    }

    params.onSpeakToggle({
      id: "translation",
      value: selectedText,
      lang: params.direction === "vi-to-en" ? "en-US" : "vi-VN"
    });
  });

  const copyButton = iconButton("Copy translation", "copy", palette);
  copyButton.addEventListener("click", async () => {
    if (!selectedText) {
      return;
    }

    await params.onCopy(selectedText);
    showCopyFeedback(copyButton, "Copy translation", "copy");
  });

  const copyAllButton =
    params.direction === "vi-to-en" ? iconButton("Copy all translations", "copy-all", palette) : null;
  copyAllButton?.addEventListener("click", async () => {
    if (!translationTexts.length) {
      return;
    }

    await params.onCopy(translationTexts.join("\n\n"));
    showCopyFeedback(copyAllButton, "Copy all translations", "copy-all");
  });

  const settingsButton = iconButton("Settings", "settings", palette);
  settingsButton.addEventListener("click", params.onOpenSettings);

  translatedActions.append(
    speakTranslated,
    copyButton,
    ...(copyAllButton ? [copyAllButton] : []),
    settingsButton
  );

  function isInteractiveTarget(target: EventTarget | null): boolean {
    return target instanceof HTMLElement && Boolean(target.closest("button"));
  }

  function handleDragMove(event: MouseEvent): void {
    if (!isDragging) {
      return;
    }

    manualPosition = clampOverlayPosition(card, {
      left: event.clientX - dragOffsetX,
      top: event.clientY - dragOffsetY
    });
    root.style.left = `${manualPosition.left}px`;
    root.style.top = `${manualPosition.top}px`;
  }

  function handleDragEnd(): void {
    if (!isDragging) {
      return;
    }

    isDragging = false;
    card.style.cursor = "grab";
    document.removeEventListener("mousemove", handleDragMove);
    document.removeEventListener("mouseup", handleDragEnd);
  }

  card.style.cursor = "grab";
  card.addEventListener("mousedown", (event) => {
    if (isInteractiveTarget(event.target)) {
      return;
    }

    isDragging = true;
    const rect = root.getBoundingClientRect();
    dragOffsetX = event.clientX - rect.left;
    dragOffsetY = event.clientY - rect.top;
    card.style.cursor = "grabbing";
    document.addEventListener("mousemove", handleDragMove);
    document.addEventListener("mouseup", handleDragEnd);
    event.preventDefault();
  });

  function paintSpeakerButton(
    button: HTMLButtonElement,
    isActive: boolean,
    icon: "volume" | "pause"
  ): void {
    button.style.background = isActive
      ? "linear-gradient(135deg, #0f766e 0%, #14b8a6 100%)"
      : palette.controlBackground;
    button.style.color = isActive ? "#ffffff" : "#334155";
    button.style.border = isActive ? "1px solid #0f766e" : palette.controlBorder;
    button.style.boxShadow = isActive
      ? "0 10px 24px rgba(20, 184, 166, 0.24)"
      : palette.controlShadow;
    applyBackdropGlass(button, controlGlassBlur);
    setIcon(button, icon);
  }

  function syncSpeakerButtons(): void {
    paintSpeakerButton(speakOriginal, speakingTarget === "original", speakingTarget === "original" ? "pause" : "volume");
    paintSpeakerButton(
      speakTranslated,
      speakingTarget === "translation",
      speakingTarget === "translation" ? "pause" : "volume"
    );
  }

  function setActionAvailability(isEnabled: boolean): void {
    speakTranslated.disabled = !isEnabled;
    copyButton.disabled = !isEnabled;
    if (copyAllButton) {
      copyAllButton.disabled = !isEnabled;
    }
    speakTranslated.style.opacity = isEnabled ? "1" : "0.5";
    copyButton.style.opacity = isEnabled ? "1" : "0.5";
    if (copyAllButton) {
      copyAllButton.style.opacity = isEnabled ? "1" : "0.5";
    }
    speakTranslated.style.cursor = isEnabled ? "pointer" : "not-allowed";
    copyButton.style.cursor = isEnabled ? "pointer" : "not-allowed";
    if (copyAllButton) {
      copyAllButton.style.cursor = isEnabled ? "pointer" : "not-allowed";
    }
  }

  function resetCopyFeedback(button: HTMLButtonElement, label: string, icon: IconName): void {
    setIcon(button, icon);
    button.setAttribute("aria-label", label);
    button.title = label;
    paintDefaultIconButton(button, palette);
    button.style.transform = "";
  }

  function showCopyFeedback(button: HTMLButtonElement, label: string, icon: IconName): void {
    const activeTimer = copyFeedbackTimers.get(button);
    if (activeTimer !== undefined) {
      window.clearTimeout(activeTimer);
    }

    button.setAttribute("aria-label", "Copied");
    button.title = "Copied";
    setIcon(button, "check");
    button.style.background = "linear-gradient(135deg, #0f766e 0%, #14b8a6 100%)";
    button.style.color = "#ffffff";
    button.style.border = "1px solid #0f766e";
    button.style.boxShadow = "0 10px 24px rgba(20, 184, 166, 0.24)";
    button.style.transform = "scale(1.12)";

    window.setTimeout(() => {
      button.style.transform = "scale(1)";
    }, 140);

    const resetTimer = window.setTimeout(() => {
      copyFeedbackTimers.delete(button);
      resetCopyFeedback(button, label, icon);
    }, 900);
    copyFeedbackTimers.set(button, resetTimer);
  }

  function getOptionText(option: RenderableTranslationOption): string {
    return typeof option === "string" ? option : option.text;
  }

  function getOptionLabel(option: RenderableTranslationOption): string {
    if (typeof option === "string") {
      return "";
    }

    return (
      option.label ??
      (option.source === "google"
        ? "Google Translate"
        : option.source === "gpt"
          ? "GPT"
          : option.source === "gemini"
            ? "Gemini"
            : "")
    );
  }

  function createPendingRow(label: string): HTMLDivElement {
    const sourceLabel = label.toLowerCase().includes("gemini") ? "Gemini" : "GPT";
    const pendingRow = document.createElement("div");
    pendingRow.setAttribute("aria-label", label);
    pendingRow.style.borderRadius = "15px";
    pendingRow.style.padding = "10px 12px";
    pendingRow.style.display = "flex";
    pendingRow.style.alignItems = "center";
    pendingRow.style.gap = "10px";
    pendingRow.style.background = palette.panelBackground;
    pendingRow.style.border = palette.pendingBorder;
    pendingRow.style.color = "#475569";
    pendingRow.style.boxShadow = palette.statusShadow;
    applyBackdropGlass(pendingRow);

    const spinner = document.createElement("span");
    spinner.style.width = "14px";
    spinner.style.height = "14px";
    spinner.style.borderRadius = "999px";
    spinner.style.border = "2px solid #ccfbf1";
    spinner.style.borderTopColor = "#0f766e";
    spinner.style.flex = "0 0 auto";
    spinner.style.animation = "translate-extension-spin 900ms linear infinite";
    pendingRow.appendChild(spinner);

    const textWrap = document.createElement("span");
    textWrap.style.display = "grid";
    textWrap.style.gap = "2px";
    textWrap.style.minWidth = "0";

    const source = document.createElement("span");
    source.textContent = sourceLabel;
    source.style.fontSize = "10px";
    source.style.fontWeight = "800";
    source.style.lineHeight = "1.2";
    source.style.letterSpacing = "0";
    source.style.textTransform = "uppercase";
    source.style.color = "#0f766e";
    textWrap.appendChild(source);

    const text = document.createElement("span");
    text.textContent = label;
    text.style.fontSize = "13px";
    text.style.fontWeight = "700";
    text.style.lineHeight = "1.4";
    text.style.letterSpacing = "0";
    text.style.color = "#475569";
    textWrap.appendChild(text);

    pendingRow.appendChild(textWrap);
    return pendingRow;
  }

  function createInlineErrorRow(message: string): HTMLDivElement {
    const errorRow = document.createElement("div");
    errorRow.setAttribute("aria-label", message);
    errorRow.style.borderRadius = "15px";
    errorRow.style.padding = "8px 10px";
    errorRow.style.background = palette.errorBackground;
    errorRow.style.border = palette.errorBorder;
    errorRow.style.color = "#b91c1c";
    errorRow.style.boxShadow = palette.statusShadow;
    applyBackdropGlass(errorRow);

    const label = document.createElement("span");
    label.textContent = "AI Error";
    label.style.display = "block";
    label.style.marginBottom = "3px";
    label.style.fontSize = "9px";
    label.style.fontWeight = "800";
    label.style.lineHeight = "1.2";
    label.style.letterSpacing = "0";
    label.style.textTransform = "uppercase";
    label.style.color = "#b91c1c";
    errorRow.appendChild(label);

    const text = document.createElement("span");
    text.textContent = message;
    text.style.display = "block";
    text.style.fontSize = "11px";
    text.style.fontWeight = "600";
    text.style.lineHeight = "1.4";
    text.style.letterSpacing = "0";
    text.style.wordBreak = "break-word";
    errorRow.appendChild(text);

    return errorRow;
  }

  function renderOptions(
    options: RenderableTranslationOption[],
    pendingLabel?: string,
    errorLabel?: string
  ): void {
    optionsContainer.innerHTML = "";
    translationTexts = options.map((option) => getOptionText(option)).filter(Boolean);
    selectedText = options[0] ? getOptionText(options[0]) : "";

    options.forEach((option, index) => {
      const optionText = getOptionText(option);
      const optionLabel = getOptionLabel(option);
      const optionButton = document.createElement("button");
      optionButton.type = "button";
      optionButton.style.width = "100%";
      optionButton.style.appearance = "none";
      optionButton.style.borderRadius = "15px";
      optionButton.style.padding = "10px 12px";
      optionButton.style.textAlign = "left";
      optionButton.style.fontSize = "13px";
      optionButton.style.fontWeight = index === 0 ? "800" : "700";
      optionButton.style.lineHeight = "1.5";
      optionButton.style.wordBreak = "break-word";
      optionButton.style.cursor = "pointer";
      optionButton.style.transition =
        "transform 140ms ease, box-shadow 140ms ease, border-color 140ms ease, background 140ms ease";
      optionButton.style.opacity = "1";
      optionButton.style.background =
        index === 0
          ? palette.selectedBackground
          : palette.panelBackground;
      optionButton.style.border = index === 0 ? palette.tealBorder : palette.border;
      optionButton.style.color = index === 0 ? "#0f172a" : "#334155";
      optionButton.style.boxShadow = index === 0 ? palette.selectedOptionShadow : palette.optionShadow;
      applyBackdropGlass(optionButton);

      if (optionLabel) {
        const label = document.createElement("span");
        label.dataset.translationOptionLabel = "true";
        label.textContent = optionLabel;
        label.style.display = "block";
        label.style.marginBottom = "4px";
        label.style.fontSize = "10px";
        label.style.fontWeight = "800";
        label.style.lineHeight = "1.2";
        label.style.letterSpacing = "0";
        label.style.textTransform = "uppercase";
        label.style.color = index === 0 ? "#0f766e" : "#64748b";
        optionButton.appendChild(label);
      }

      const text = document.createElement("span");
      text.textContent = optionText;
      text.style.display = "block";
      text.style.letterSpacing = "0";
      text.style.whiteSpace = "pre-wrap";
      optionButton.appendChild(text);

      optionButton.addEventListener("click", () => {
        selectedText = optionText;
        Array.from(optionsContainer.children).forEach((child) => {
          if (child instanceof HTMLButtonElement) {
            child.style.background = palette.panelBackground;
            child.style.border = palette.border;
            child.style.color = "#334155";
            child.style.opacity = "1";
            child.style.fontWeight = "700";
            child.style.boxShadow = palette.optionShadow;
            child.querySelectorAll("[data-translation-option-label]").forEach((label) => {
              if (label instanceof HTMLElement) {
                label.style.color = "#64748b";
              }
            });
          }
        });
        optionButton.style.background = palette.selectedBackground;
        optionButton.style.border = palette.tealBorder;
        optionButton.style.color = "#0f172a";
        optionButton.style.opacity = "1";
        optionButton.style.fontWeight = "800";
        optionButton.style.boxShadow = palette.selectedOptionShadow;
        optionButton.querySelectorAll("[data-translation-option-label]").forEach((label) => {
          if (label instanceof HTMLElement) {
            label.style.color = "#0f766e";
          }
        });
      });

      optionsContainer.appendChild(optionButton);
    });

    if (pendingLabel) {
      optionsContainer.appendChild(createPendingRow(pendingLabel));
    }

    if (errorLabel) {
      optionsContainer.appendChild(createInlineErrorRow(errorLabel));
    }

    setActionAvailability(Boolean(selectedText));
    syncSpeakerButtons();
    manualPosition = positionOverlay(root, card, params.anchorRect, manualPosition);
  }

  function setStatus(message: string, tone: "muted" | "error" = "muted"): void {
    optionsContainer.innerHTML = "";
    translationTexts = [];
    statusMessage.textContent = message;
    statusMessage.style.background =
      tone === "error"
        ? palette.errorBackground
        : palette.mutedBackground;
    statusMessage.style.border = tone === "error" ? palette.errorBorder : palette.border;
    statusMessage.style.color = tone === "error" ? "#b91c1c" : "#64748b";
    optionsContainer.appendChild(statusMessage);
    selectedText = "";
    setActionAvailability(false);
    if (speakingTarget === "translation") {
      speakingTarget = null;
    }
    syncSpeakerButtons();
    manualPosition = positionOverlay(root, card, params.anchorRect, manualPosition);
  }

  setStatus("Loading translation...");
  syncSpeakerButtons();

  return {
    element: root,
    getSelectedText: () => selectedText,
    setLoading: (label = "Loading translation...") => {
      setStatus(label);
    },
    setTranslations: (options, pendingLabel, errorLabel) => {
      renderOptions(options, pendingLabel, errorLabel);
    },
    setError: (message) => {
      setStatus(message, "error");
    },
    setSpeaking: (id) => {
      speakingTarget = id;
      syncSpeakerButtons();
    },
    destroy: () => {
      handleDragEnd();
      copyFeedbackTimers.forEach((timer) => window.clearTimeout(timer));
      copyFeedbackTimers.clear();
      root.remove();
    }
  };
}
