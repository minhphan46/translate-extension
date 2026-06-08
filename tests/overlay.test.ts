import { fireEvent, getByLabelText, getByText, queryByLabelText, queryByText } from "@testing-library/dom";
import { createTranslationOverlay } from "../src/content/overlay";

describe("createTranslationOverlay", () => {
  it("uses transparent glass theme by default", () => {
    const overlay = createTranslationOverlay({
      originalText: "xin chao",
      direction: "vi-to-en",
      anchorRect: new DOMRect(100, 180, 120, 24),
      onCopy: vi.fn(),
      onOpenSettings: vi.fn(),
      onSpeakToggle: vi.fn()
    });

    const card = overlay.element.firstElementChild as HTMLElement;
    expect(card.style.borderWidth).toBe("0px");
    expect(card.style.background).toContain("rgba(255, 255, 255, 0.18)");
  });

  it("uses white panel theme when requested", () => {
    const overlay = createTranslationOverlay({
      originalText: "xin chao",
      direction: "vi-to-en",
      theme: "white",
      anchorRect: new DOMRect(100, 180, 120, 24),
      onCopy: vi.fn(),
      onOpenSettings: vi.fn(),
      onSpeakToggle: vi.fn()
    });

    const card = overlay.element.firstElementChild as HTMLElement;
    expect(card.style.border).toBe("1px solid rgba(226, 232, 240, 0.95)");
    expect(card.style.background).toBe("rgb(255, 255, 255)");
  });

  it("renders original text and copies selected option", async () => {
    const onCopy = vi.fn(async () => {});
    const onOpenSettings = vi.fn();

    const overlay = createTranslationOverlay({
      originalText: "xin chao",
      direction: "vi-to-en",
      anchorRect: new DOMRect(100, 180, 120, 24),
      onCopy,
      onOpenSettings,
      onSpeakToggle: vi.fn()
    });

    document.body.appendChild(overlay.element);
    overlay.setTranslations(["hello", "hi"]);
    fireEvent.click(getByText(document.body, "hi"));
    fireEvent.click(getByLabelText(document.body, "Copy translation"));

    expect(onCopy).toHaveBeenCalledWith("hi");
  });

  it("shows copied feedback before returning copy button to normal", async () => {
    vi.useFakeTimers();
    const onCopy = vi.fn(async () => {});

    try {
      const overlay = createTranslationOverlay({
        originalText: "xin chao",
        direction: "vi-to-en",
        anchorRect: new DOMRect(100, 180, 120, 24),
        onCopy,
        onOpenSettings: vi.fn(),
        onSpeakToggle: vi.fn()
      });

      document.body.appendChild(overlay.element);
      overlay.setTranslations(["hello"]);

      const copyButton = getByLabelText(document.body, "Copy translation") as HTMLButtonElement;
      fireEvent.click(copyButton);
      await Promise.resolve();

      expect(getByLabelText(document.body, "Copied")).toBe(copyButton);
      expect(copyButton.style.transform).toBe("scale(1.12)");

      vi.advanceTimersByTime(140);
      expect(copyButton.style.transform).toBe("scale(1)");

      vi.advanceTimersByTime(760);
      expect(getByLabelText(document.body, "Copy translation")).toBe(copyButton);
      expect(copyButton.style.color).toBe("rgb(51, 65, 85)");
    } finally {
      vi.useRealTimers();
    }
  });

  it("copies all English options at once", async () => {
    const onCopy = vi.fn(async () => {});
    const overlay = createTranslationOverlay({
      originalText: "xin chao",
      direction: "vi-to-en",
      anchorRect: new DOMRect(100, 180, 120, 24),
      onCopy,
      onOpenSettings: vi.fn(),
      onSpeakToggle: vi.fn()
    });

    document.body.appendChild(overlay.element);
    overlay.setTranslations(["hello", "hi", "good day"]);
    fireEvent.click(getByLabelText(document.body, "Copy all translations"));

    expect(onCopy).toHaveBeenCalledWith("hello\n\nhi\n\ngood day");
  });

  it("renders multiline translations with preserved whitespace", () => {
    const overlay = createTranslationOverlay({
      originalText: "1. xin chao\n2. tam biet",
      direction: "vi-to-en",
      anchorRect: new DOMRect(100, 180, 120, 24),
      onCopy: vi.fn(),
      onOpenSettings: vi.fn(),
      onSpeakToggle: vi.fn()
    });

    document.body.appendChild(overlay.element);
    overlay.setTranslations(["1. hello\n2. goodbye"]);

    const multilineElements = Array.from(document.body.querySelectorAll("p, span")).filter(
      (element): element is HTMLElement => element instanceof HTMLElement
    );
    const original = multilineElements.find((element) => element.textContent === "1. xin chao\n2. tam biet");
    const translation = multilineElements.find((element) => element.textContent === "1. hello\n2. goodbye");

    expect(original?.style.whiteSpace).toBe("pre-wrap");
    expect(translation?.style.whiteSpace).toBe("pre-wrap");
  });

  it("shows a GPT loading row without including it in copy all", async () => {
    const onCopy = vi.fn(async () => {});
    const overlay = createTranslationOverlay({
      originalText: "xin chao",
      direction: "vi-to-en",
      anchorRect: new DOMRect(100, 180, 120, 24),
      onCopy,
      onOpenSettings: vi.fn(),
      onSpeakToggle: vi.fn()
    });

    document.body.appendChild(overlay.element);
    overlay.setTranslations(
      [{ text: "hello", source: "google", label: "Google Translate" }],
      "GPT is translating..."
    );

    expect(getByLabelText(document.body, "GPT is translating...")).toBeTruthy();
    fireEvent.click(getByLabelText(document.body, "Copy all translations"));

    expect(onCopy).toHaveBeenCalledWith("hello");
  });

  it("shows Gemini as the loading source for Gemini translations", () => {
    const overlay = createTranslationOverlay({
      originalText: "xin chao",
      direction: "vi-to-en",
      anchorRect: new DOMRect(100, 180, 120, 24),
      onCopy: vi.fn(),
      onOpenSettings: vi.fn(),
      onSpeakToggle: vi.fn()
    });

    document.body.appendChild(overlay.element);
    overlay.setTranslations(
      [{ text: "hello", source: "google", label: "Google Translate" }],
      "Gemini is translating..."
    );

    const loadingRow = getByLabelText(document.body, "Gemini is translating...");
    expect(getByText(loadingRow, "Gemini")).toBeTruthy();
    expect(queryByText(loadingRow, "GPT")).toBeNull();
  });

  it("shows AI errors in the translation area without copying them", async () => {
    const onCopy = vi.fn(async () => {});
    const overlay = createTranslationOverlay({
      originalText: "xin chao",
      direction: "vi-to-en",
      anchorRect: new DOMRect(100, 180, 120, 24),
      onCopy,
      onOpenSettings: vi.fn(),
      onSpeakToggle: vi.fn()
    });

    document.body.appendChild(overlay.element);
    overlay.setTranslations(
      [{ text: "hello", source: "google", label: "Google Translate" }],
      undefined,
      "Gemini error: API key invalid"
    );

    expect(getByText(document.body, "AI Error")).toBeTruthy();
    expect(getByText(document.body, "Gemini error: API key invalid")).toBeTruthy();
    fireEvent.click(getByLabelText(document.body, "Copy all translations"));

    expect(onCopy).toHaveBeenCalledWith("hello");
  });

  it("does not show copy all for foreign to Vietnamese results", () => {
    const overlay = createTranslationOverlay({
      originalText: "hello",
      direction: "foreign-to-vi",
      anchorRect: new DOMRect(100, 180, 120, 24),
      onCopy: vi.fn(),
      onOpenSettings: vi.fn(),
      onSpeakToggle: vi.fn()
    });

    document.body.appendChild(overlay.element);
    overlay.setTranslations(["xin chao"]);

    expect(queryByLabelText(document.body, "Copy all translations")).toBeNull();
  });

  it("positions overlay near selection instead of viewport bottom", () => {
    Object.defineProperty(window, "innerWidth", { value: 1440, configurable: true });
    Object.defineProperty(window, "innerHeight", { value: 900, configurable: true });

    const overlay = createTranslationOverlay({
      originalText: "xin chao",
      direction: "vi-to-en",
      anchorRect: new DOMRect(500, 320, 120, 24),
      onCopy: vi.fn(),
      onOpenSettings: vi.fn(),
      onSpeakToggle: vi.fn()
    });

    expect(Number.parseFloat(overlay.element.style.top)).toBeGreaterThanOrEqual(12);
    expect(Number.parseFloat(overlay.element.style.top)).toBeLessThan(320);
    expect(Number.parseFloat(overlay.element.style.left)).toBeGreaterThanOrEqual(12);
    expect(overlay.element.style.bottom).toBe("");
    expect(overlay.element.style.right).toBe("");
  });

  it("keeps overlay inside viewport when selection is near screen bottom", () => {
    Object.defineProperty(window, "innerWidth", { value: 800, configurable: true });
    Object.defineProperty(window, "innerHeight", { value: 500, configurable: true });

    const overlay = createTranslationOverlay({
      originalText: "xin chao",
      direction: "vi-to-en",
      anchorRect: new DOMRect(450, 460, 100, 18),
      onCopy: vi.fn(),
      onOpenSettings: vi.fn(),
      onSpeakToggle: vi.fn()
    });

    document.body.appendChild(overlay.element);

    const top = Number.parseFloat(overlay.element.style.top);
    expect(top).toBeGreaterThanOrEqual(12);
    expect(top).toBeLessThanOrEqual(488);
  });

  it("shows loading first then updates with translated options", () => {
    const overlay = createTranslationOverlay({
      originalText: "xin chao",
      direction: "vi-to-en",
      anchorRect: new DOMRect(100, 180, 120, 24),
      onCopy: vi.fn(),
      onOpenSettings: vi.fn(),
      onSpeakToggle: vi.fn()
    });

    document.body.appendChild(overlay.element);
    expect(getByText(document.body, "Loading translation...")).toBeTruthy();

    overlay.setTranslations(["hello", "hi"]);

    expect(getByText(document.body, "hello")).toBeTruthy();
    expect(getByText(document.body, "hi")).toBeTruthy();
  });

  it("switches speaker icon state when speaking target changes", () => {
    const overlay = createTranslationOverlay({
      originalText: "xin chao",
      direction: "vi-to-en",
      anchorRect: new DOMRect(100, 180, 120, 24),
      onCopy: vi.fn(),
      onOpenSettings: vi.fn(),
      onSpeakToggle: vi.fn()
    });

    document.body.appendChild(overlay.element);
    const speakOriginal = getByLabelText(document.body, "Speak original") as HTMLButtonElement;
    expect(speakOriginal.style.color).toBe("rgb(51, 65, 85)");

    overlay.setSpeaking("original");
    expect(speakOriginal.style.color).toBe("rgb(255, 255, 255)");

    overlay.setSpeaking(null);
    expect(speakOriginal.style.color).toBe("rgb(51, 65, 85)");
  });

  it("supports dragging the modal", () => {
    Object.defineProperty(window, "innerWidth", { value: 1200, configurable: true });
    Object.defineProperty(window, "innerHeight", { value: 900, configurable: true });

    const overlay = createTranslationOverlay({
      originalText: "drag me",
      direction: "vi-to-en",
      anchorRect: new DOMRect(300, 300, 120, 24),
      onCopy: vi.fn(),
      onOpenSettings: vi.fn(),
      onSpeakToggle: vi.fn()
    });

    document.body.appendChild(overlay.element);
    const beforeLeft = Number.parseFloat(overlay.element.style.left);
    const beforeTop = Number.parseFloat(overlay.element.style.top);

    fireEvent.mouseDown(overlay.element.firstElementChild as Element, { clientX: beforeLeft + 20, clientY: beforeTop + 20 });
    fireEvent.mouseMove(document, { clientX: beforeLeft + 120, clientY: beforeTop + 100 });
    fireEvent.mouseUp(document);

    expect(Number.parseFloat(overlay.element.style.left)).not.toBe(beforeLeft);
    expect(Number.parseFloat(overlay.element.style.top)).not.toBe(beforeTop);
  });
});
