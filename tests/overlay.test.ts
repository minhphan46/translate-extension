import { fireEvent, getByText } from "@testing-library/dom";
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
      onSpeak: vi.fn()
    });

    document.body.appendChild(overlay.element);
    overlay.setTranslations(["hello", "hi"]);
    fireEvent.click(getByText(document.body, "hi"));
    fireEvent.click(getByText(document.body, "Copy"));

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
      onSpeak: vi.fn()
    });

    expect(overlay.element.style.top).toBe("48px");
    expect(overlay.element.style.left).toBe("260px");
    expect(overlay.element.style.bottom).toBe("");
    expect(overlay.element.style.right).toBe("");
  });

  it("shows loading first then updates with translated options", () => {
    const overlay = createTranslationOverlay({
      originalText: "xin chao",
      direction: "vi-to-en",
      anchorRect: new DOMRect(100, 180, 120, 24),
      onCopy: vi.fn(),
      onOpenSettings: vi.fn(),
      onSpeak: vi.fn()
    });

    document.body.appendChild(overlay.element);
    expect(getByText(document.body, "Loading translation...")).toBeTruthy();

    overlay.setTranslations(["hello", "hi"]);

    expect(getByText(document.body, "hello")).toBeTruthy();
    expect(getByText(document.body, "hi")).toBeTruthy();
  });
});
