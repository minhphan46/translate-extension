import type { TranslationDirection } from "../shared/types";

interface OverlayParams {
  originalText: string;
  direction: TranslationDirection;
  anchorRect: DOMRect;
  onCopy: (value: string) => Promise<void> | void;
  onOpenSettings: () => void;
  onSpeak: (value: string, lang: string) => void;
}

interface OverlayHandle {
  element: HTMLDivElement;
  getSelectedText: () => string;
  setLoading: (label?: string) => void;
  setTranslations: (options: string[]) => void;
  setError: (message: string) => void;
  destroy: () => void;
}

function iconButton(label: string): HTMLButtonElement {
  const button = document.createElement("button");
  button.type = "button";
  button.textContent = label;
  button.className =
    "rounded-full border border-slate-200 bg-white/90 px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:border-teal-400 hover:text-teal-700";
  button.style.background = "#ffffff";
  button.style.opacity = "1";
  button.style.color = "#334155";
  button.style.border = "1px solid #cbd5e1";
  return button;
}

function positionOverlay(root: HTMLDivElement, anchorRect: DOMRect): void {
  const overlayWidth = 360;
  const overlayHeight = 260;
  const gap = 12;
  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;

  let left = anchorRect.right - overlayWidth;
  if (left < 12) {
    left = anchorRect.left;
  }
  if (left + overlayWidth > viewportWidth - 12) {
    left = viewportWidth - overlayWidth - 12;
  }
  left = Math.max(12, left);

  let top = anchorRect.top - overlayHeight - gap;
  if (top < 12) {
    top = anchorRect.bottom + gap;
  }
  if (top + overlayHeight > viewportHeight - 12) {
    top = Math.max(12, viewportHeight - overlayHeight - 12);
  }

  root.style.left = `${left}px`;
  root.style.top = `${top}px`;
}

export function createTranslationOverlay(params: OverlayParams): OverlayHandle {
  const root = document.createElement("div");
  root.className = "translate-extension-root";
  root.style.all = "initial";
  root.style.position = "fixed";
  root.style.zIndex = "2147483647";
  root.style.fontFamily = "Inter, system-ui, sans-serif";
  root.style.opacity = "1";
  root.style.color = "#0f172a";
  positionOverlay(root, params.anchorRect);

  const card = document.createElement("div");
  card.className =
    "w-[360px] overflow-hidden rounded-3xl border border-slate-200 bg-white text-slate-900 shadow-[0_24px_80px_rgba(15,23,42,0.18)]";
  card.style.background = "#ffffff";
  card.style.opacity = "1";
  card.style.border = "1px solid #e2e8f0";
  card.style.boxShadow = "0 24px 80px rgba(15, 23, 42, 0.18)";
  root.appendChild(card);

  const header = document.createElement("div");
  header.className = "border-b border-slate-100 bg-white px-5 py-4";
  header.style.background = "#ffffff";
  header.style.borderBottom = "1px solid #f1f5f9";
  header.innerHTML =
    '<div style="font-size:12px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:#0f766e">Quick Translate</div>';
  card.appendChild(header);

  const body = document.createElement("div");
  body.className = "space-y-4 px-5 py-4";
  body.style.background = "#ffffff";
  card.appendChild(body);

  const originalBlock = document.createElement("div");
  originalBlock.className = "rounded-2xl bg-slate-50 p-4";
  originalBlock.style.background = "#f8fafc";
  originalBlock.style.opacity = "1";
  body.appendChild(originalBlock);

  const originalLabel = document.createElement("div");
  originalLabel.className = "mb-2 flex items-center justify-between text-xs font-semibold uppercase tracking-[0.2em] text-slate-500";
  originalLabel.textContent = "Original";
  originalBlock.appendChild(originalLabel);

  const originalText = document.createElement("p");
  originalText.textContent = params.originalText;
  originalText.style.margin = "0";
  originalText.style.fontSize = "14px";
  originalText.style.lineHeight = "1.6";
  originalBlock.appendChild(originalText);

  const speakOriginal = iconButton("Speak");
  speakOriginal.addEventListener("click", () => {
    params.onSpeak(params.originalText, params.direction === "vi-to-en" ? "vi-VN" : "auto");
  });
  originalLabel.appendChild(speakOriginal);

  const translatedBlock = document.createElement("div");
  translatedBlock.className = "rounded-2xl border border-slate-200 bg-white p-4 text-slate-900";
  translatedBlock.style.background = "#ffffff";
  translatedBlock.style.border = "1px solid #e2e8f0";
  translatedBlock.style.opacity = "1";
  body.appendChild(translatedBlock);

  const translatedLabel = document.createElement("div");
  translatedLabel.className = "mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-teal-700";
  translatedLabel.textContent = params.direction === "vi-to-en" ? "English Options" : "Vietnamese";
  translatedBlock.appendChild(translatedLabel);

  let selectedText = "";

  const optionsContainer = document.createElement("div");
  optionsContainer.className = "space-y-2";
  translatedBlock.appendChild(optionsContainer);

  const statusMessage = document.createElement("div");
  statusMessage.className = "rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-500";
  statusMessage.style.background = "#f8fafc";
  statusMessage.style.border = "1px solid #e2e8f0";
  statusMessage.style.color = "#64748b";
  optionsContainer.appendChild(statusMessage);

  const actions = document.createElement("div");
  actions.className = "mt-4 flex items-center gap-2";
  translatedBlock.appendChild(actions);

  const speakTranslated = iconButton("Speak");
  speakTranslated.addEventListener("click", () => {
    params.onSpeak(selectedText, params.direction === "vi-to-en" ? "en-US" : "vi-VN");
  });

  const copyButton = iconButton("Copy");
  copyButton.addEventListener("click", async () => {
    await params.onCopy(selectedText);
  });

  const settingsButton = iconButton("Settings");
  settingsButton.addEventListener("click", params.onOpenSettings);

  actions.append(speakTranslated, copyButton, settingsButton);

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
      optionButton.className =
        index === 0
          ? "block w-full rounded-2xl border border-teal-400 bg-teal-50 px-4 py-3 text-left text-sm font-medium text-slate-900"
          : "block w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-left text-sm font-medium text-slate-700";
      optionButton.style.opacity = "1";
      optionButton.style.background = index === 0 ? "#f0fdfa" : "#ffffff";
      optionButton.style.border = index === 0 ? "1px solid #2dd4bf" : "1px solid #e2e8f0";
      optionButton.style.color = index === 0 ? "#0f172a" : "#334155";

      optionButton.addEventListener("click", () => {
        selectedText = option;
        Array.from(optionsContainer.children).forEach((child) => {
          child.className =
            "block w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-left text-sm font-medium text-slate-700";
          if (child instanceof HTMLButtonElement) {
            child.style.background = "#ffffff";
            child.style.border = "1px solid #e2e8f0";
            child.style.color = "#334155";
            child.style.opacity = "1";
          }
        });
        optionButton.className =
          "block w-full rounded-2xl border border-teal-400 bg-teal-50 px-4 py-3 text-left text-sm font-medium text-slate-900";
        optionButton.style.background = "#f0fdfa";
        optionButton.style.border = "1px solid #2dd4bf";
        optionButton.style.color = "#0f172a";
        optionButton.style.opacity = "1";
      });

      optionsContainer.appendChild(optionButton);
    });

    setActionAvailability(Boolean(selectedText));
  }

  function setStatus(message: string, tone: "muted" | "error" = "muted"): void {
    optionsContainer.innerHTML = "";
    statusMessage.textContent = message;
    statusMessage.style.background = tone === "error" ? "#fef2f2" : "#f8fafc";
    statusMessage.style.border = tone === "error" ? "1px solid #fecaca" : "1px solid #e2e8f0";
    statusMessage.style.color = tone === "error" ? "#b91c1c" : "#64748b";
    optionsContainer.appendChild(statusMessage);
    selectedText = "";
    setActionAvailability(false);
  }

  setStatus("Loading translation...");

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
    destroy: () => root.remove()
  };
}
