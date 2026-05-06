import createLucideElement from "lucide/dist/esm/createElement.mjs";
import Copy from "lucide/dist/esm/icons/copy.mjs";
import Pause from "lucide/dist/esm/icons/pause.mjs";
import Settings from "lucide/dist/esm/icons/settings.mjs";
import Volume2 from "lucide/dist/esm/icons/volume-2.mjs";
import type { TranslationDirection } from "../shared/types";

interface OverlayParams {
  originalText: string;
  direction: TranslationDirection;
  anchorRect: DOMRect;
  onCopy: (value: string) => Promise<void> | void;
  onOpenSettings: () => void;
  onSpeakToggle: (payload: { id: "original" | "translation"; value: string; lang: string }) => void;
}

interface OverlayHandle {
  element: HTMLDivElement;
  getSelectedText: () => string;
  setLoading: (label?: string) => void;
  setTranslations: (options: string[]) => void;
  setError: (message: string) => void;
  setSpeaking: (id: "original" | "translation" | null) => void;
  destroy: () => void;
}

interface PositionBox {
  left: number;
  top: number;
}

function resolveIcon(icon: "volume" | "pause" | "copy" | "settings") {
  if (icon === "volume") {
    return Volume2;
  }

  if (icon === "pause") {
    return Pause;
  }

  if (icon === "copy") {
    return Copy;
  }

  return Settings;
}

function iconButton(label: string, icon: "volume" | "pause" | "copy" | "settings"): HTMLButtonElement {
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
  button.style.background = "#ffffff";
  button.style.color = "#334155";
  button.style.border = "1px solid #dbe4f0";
  button.style.boxShadow = "0 8px 20px rgba(15, 23, 42, 0.06)";
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

function setIcon(button: HTMLButtonElement, icon: "volume" | "pause" | "copy" | "settings"): void {
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
  card.style.background = "#ffffff";
  card.style.opacity = "1";
  card.style.border = "1px solid rgba(226, 232, 240, 0.95)";
  card.style.boxShadow = "0 28px 90px rgba(15, 23, 42, 0.22)";
  root.appendChild(card);
  let manualPosition: PositionBox | null = null;
  let isDragging = false;
  let dragOffsetX = 0;
  let dragOffsetY = 0;
  positionOverlay(root, card, params.anchorRect);

  const body = document.createElement("div");
  body.style.background = "#ffffff";
  body.style.padding = "12px";
  body.style.display = "grid";
  body.style.gap = "10px";
  body.style.background = "#ffffff";
  body.style.overflowY = "auto";
  body.style.overscrollBehavior = "contain";
  card.appendChild(body);

  const originalBlock = document.createElement("div");
  originalBlock.style.borderRadius = "18px";
  originalBlock.style.background = "linear-gradient(180deg, #f8fafc 0%, #f1f5f9 100%)";
  originalBlock.style.padding = "12px";
  originalBlock.style.opacity = "1";
  originalBlock.style.border = "1px solid #e2e8f0";
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
  originalBlock.appendChild(originalText);

  let speakingTarget: "original" | "translation" | null = null;

  const speakOriginal = iconButton("Speak original", "volume");
  speakOriginal.addEventListener("click", () => {
    params.onSpeakToggle({
      id: "original",
      value: params.originalText,
      lang: params.direction === "vi-to-en" ? "vi-VN" : "auto"
    });
  });

  const copyOriginal = iconButton("Copy original", "copy");
  copyOriginal.addEventListener("click", async () => {
    await params.onCopy(params.originalText);
  });

  originalActions.append(speakOriginal, copyOriginal);

  const translatedBlock = document.createElement("div");
  translatedBlock.style.borderRadius = "18px";
  translatedBlock.style.background = "#ffffff";
  translatedBlock.style.border = "1px solid #e2e8f0";
  translatedBlock.style.opacity = "1";
  translatedBlock.style.padding = "12px";
  translatedBlock.style.boxShadow = "inset 0 1px 0 rgba(255, 255, 255, 0.8)";
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
  statusMessage.style.background = "linear-gradient(180deg, #f8fafc 0%, #f1f5f9 100%)";
  statusMessage.style.border = "1px solid #e2e8f0";
  statusMessage.style.color = "#64748b";
  optionsContainer.appendChild(statusMessage);

  const speakTranslated = iconButton("Speak translation", "volume");
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

  const copyButton = iconButton("Copy translation", "copy");
  copyButton.addEventListener("click", async () => {
    await params.onCopy(selectedText);
  });

  const settingsButton = iconButton("Settings", "settings");
  settingsButton.addEventListener("click", params.onOpenSettings);

  translatedActions.append(speakTranslated, copyButton, settingsButton);

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
      : "#ffffff";
    button.style.color = isActive ? "#ffffff" : "#334155";
    button.style.border = isActive ? "1px solid #0f766e" : "1px solid #dbe4f0";
    button.style.boxShadow = isActive
      ? "0 10px 24px rgba(20, 184, 166, 0.24)"
      : "0 8px 20px rgba(15, 23, 42, 0.06)";
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
    speakTranslated.style.opacity = isEnabled ? "1" : "0.5";
    copyButton.style.opacity = isEnabled ? "1" : "0.5";
    speakTranslated.style.cursor = isEnabled ? "pointer" : "not-allowed";
    copyButton.style.cursor = isEnabled ? "pointer" : "not-allowed";
  }

  function renderOptions(options: string[]): void {
    optionsContainer.innerHTML = "";
    selectedText = options[0] ?? "";

    options.forEach((option, index) => {
      const optionButton = document.createElement("button");
      optionButton.type = "button";
      optionButton.textContent = option;
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
          ? "linear-gradient(135deg, #ecfeff 0%, #f0fdfa 100%)"
          : "linear-gradient(180deg, #ffffff 0%, #f8fafc 100%)";
      optionButton.style.border = index === 0 ? "1px solid #5eead4" : "1px solid #e2e8f0";
      optionButton.style.color = index === 0 ? "#0f172a" : "#334155";
      optionButton.style.boxShadow =
        index === 0 ? "0 12px 28px rgba(20, 184, 166, 0.16)" : "0 8px 20px rgba(15, 23, 42, 0.05)";

      optionButton.addEventListener("click", () => {
        selectedText = option;
        Array.from(optionsContainer.children).forEach((child) => {
          if (child instanceof HTMLButtonElement) {
            child.style.background = "linear-gradient(180deg, #ffffff 0%, #f8fafc 100%)";
            child.style.border = "1px solid #e2e8f0";
            child.style.color = "#334155";
            child.style.opacity = "1";
            child.style.fontWeight = "700";
            child.style.boxShadow = "0 8px 20px rgba(15, 23, 42, 0.05)";
          }
        });
        optionButton.style.background = "linear-gradient(135deg, #ecfeff 0%, #f0fdfa 100%)";
        optionButton.style.border = "1px solid #5eead4";
        optionButton.style.color = "#0f172a";
        optionButton.style.opacity = "1";
        optionButton.style.fontWeight = "800";
        optionButton.style.boxShadow = "0 12px 28px rgba(20, 184, 166, 0.16)";
      });

      optionsContainer.appendChild(optionButton);
    });

    setActionAvailability(Boolean(selectedText));
    syncSpeakerButtons();
    manualPosition = positionOverlay(root, card, params.anchorRect, manualPosition);
  }

  function setStatus(message: string, tone: "muted" | "error" = "muted"): void {
    optionsContainer.innerHTML = "";
    statusMessage.textContent = message;
    statusMessage.style.background =
      tone === "error"
        ? "linear-gradient(180deg, #fff1f2 0%, #ffe4e6 100%)"
        : "linear-gradient(180deg, #f8fafc 0%, #f1f5f9 100%)";
    statusMessage.style.border = tone === "error" ? "1px solid #fecaca" : "1px solid #e2e8f0";
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
    setTranslations: (options) => {
      renderOptions(options);
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
      root.remove();
    }
  };
}
