import { buildOpenAIPrompt } from "../shared/prompt";
import { extractTranslationOptions } from "../shared/options-parser";
import type { ExtensionSettings } from "../shared/types";

interface ResponsesApiOutputText {
  output_text?: string;
  output?: Array<{
    content?: Array<{
      type?: string;
      text?: string;
    }>;
  }>;
}

function getResponseText(payload: ResponsesApiOutputText): string {
  if (payload.output_text) {
    return payload.output_text;
  }

  return (
    payload.output
      ?.flatMap((item) => item.content ?? [])
      .filter((item) => item.type === "output_text" || item.type === "text")
      .map((item) => item.text ?? "")
      .join("\n") ?? ""
  );
}

export async function translateVietnameseToEnglish(
  text: string,
  settings: ExtensionSettings
): Promise<string[]> {
  const activeKey =
    settings.keys.find((item) => item.id === settings.activeKeyId) ?? settings.keys[0] ?? null;

  if (!activeKey?.apiKey) {
    throw new Error("No OpenAI API key configured.");
  }

  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${activeKey.apiKey}`
    },
    body: JSON.stringify({
      model: settings.model,
      input: buildOpenAIPrompt(settings.promptTemplate, text)
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`OpenAI request failed: ${errorText}`);
  }

  const payload = (await response.json()) as ResponsesApiOutputText;
  const options = extractTranslationOptions(getResponseText(payload));

  if (!options.length) {
    throw new Error("OpenAI did not return translation options.");
  }

  return options.slice(0, 3);
}
