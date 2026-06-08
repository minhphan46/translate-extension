import type { RuntimeMessage, RuntimeResponse } from "../shared/messages";
import { translateSelection } from "./translator";

chrome.runtime.onMessage.addListener((message: RuntimeMessage, sender, sendResponse) => {
  void (async () => {
    try {
      if (message.type === "TRANSLATE_SELECTION") {
        const requestId = message.payload.requestId;
        const tabId = sender.tab?.id;
        const data = await translateSelection(message.payload.text, (result) => {
          const sendTabMessage = chrome.tabs?.sendMessage;

          if (!requestId || tabId === undefined || !sendTabMessage) {
            return;
          }

          void sendTabMessage
            .call(chrome.tabs, tabId, {
              type: "TRANSLATION_PARTIAL",
              payload: { requestId, result }
            } satisfies RuntimeMessage)
            .catch(() => undefined);
        });
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
