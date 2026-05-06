import { fireEvent, getByLabelText, getByText } from "@testing-library/dom";
import { createTranslationOverlay } from "../src/content/overlay";

describe("createTranslationOverlay", () => {
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
});
