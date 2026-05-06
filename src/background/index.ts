import type { RuntimeMessage, RuntimeResponse } from "../shared/messages";
import { translateSelection } from "./translator";

chrome.runtime.onMessage.addListener((message: RuntimeMessage, _sender, sendResponse) => {
  void (async () => {
    try {
      if (message.type === "TRANSLATE_SELECTION") {
        const data = await translateSelection(message.payload.text);
        sendResponse({ ok: true, data } satisfies RuntimeResponse);
        return;
      }

      if (message.type === "OPEN_OPTIONS") {
        await chrome.runtime.openOptionsPage();
        sendResponse({ ok: true, data: null } satisfies RuntimeResponse);
        return;
      }

      sendResponse({ ok: false, error: "Unsupported message type." } satisfies RuntimeResponse);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      sendResponse({ ok: false, error: errorMessage } satisfies RuntimeResponse);
    }
  })();

  return true;
});
