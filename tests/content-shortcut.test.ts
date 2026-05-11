import { fireEvent, waitFor } from "@testing-library/dom";
import type { RuntimeResponse } from "../src/shared/messages";

function mockSelection(text: string): void {
  const rect = new DOMRect(100, 180, 120, 24);

  vi.spyOn(window, "getSelection").mockReturnValue({
    toString: () => text,
    rangeCount: 1,
    isCollapsed: false,
    getRangeAt: () =>
      ({
        getBoundingClientRect: () => rect,
        getClientRects: () => [rect]
      }) as Range
  } as Selection);
}

const sendMessage = vi.fn(async () => ({
  ok: true,
  data: {
    translatedText: "hello",
    translatedOptions: ["hello"],
    direction: "vi-to-en"
  }
} satisfies RuntimeResponse));

vi.mock("../src/content/overlay", () => ({
  createTranslationOverlay: () => ({
    element: document.createElement("div"),
    setLoading: vi.fn(),
    setTranslations: vi.fn(),
    setError: vi.fn(),
    setSpeaking: vi.fn(),
    destroy: vi.fn()
  })
}));

beforeAll(async () => {
  vi.stubGlobal("chrome", {
    runtime: {
      sendMessage
    }
  });
  vi.stubGlobal("speechSynthesis", {
    cancel: vi.fn(),
    speak: vi.fn(),
    speaking: false
  });

  await import("../src/content/index.ts");
});

describe("content shift shortcut", () => {
  beforeEach(() => {
    sendMessage.mockClear();
  });

  it("opens translation only after Shift is released", async () => {
    mockSelection("xin chao");

    fireEvent.keyDown(window, { key: "Shift" });
    expect(sendMessage).not.toHaveBeenCalled();

    fireEvent.keyUp(window, { key: "Shift" });
    await waitFor(() => expect(sendMessage).toHaveBeenCalledTimes(1));
  });

  it("does not open translation when another key is pressed while Shift is held", async () => {
    mockSelection("xin chao");

    fireEvent.keyDown(window, { key: "Shift" });
    fireEvent.keyDown(window, { key: "A", shiftKey: true });
    fireEvent.keyUp(window, { key: "Shift" });

    expect(sendMessage).not.toHaveBeenCalled();
  });
});
