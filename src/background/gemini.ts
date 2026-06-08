import { extractTranslationOptions } from "../shared/options-parser";
import { buildOpenAIPrompt } from "../shared/prompt";
import type { ExtensionSettings } from "../shared/types";

interface GeminiGenerateContentResponse {
  candidates?: Array<{
    content?: {
      parts?: Array<{
        text?: string;
      }>;
    };
  }>;
}

function getGeminiResponseText(payload: GeminiGenerateContentResponse): string {
  return (
    payload.candidates
      ?.flatMap((candidate) => candidate.content?.parts ?? [])
      .map((part) => part.text ?? "")
      .join("\n") ?? ""
  );
}

export async function translateVietnameseToEnglishWithGemini(
  text: string,
  settings: ExtensionSettings
): Promise<string[]> {
  const activeKey =
    settings.geminiKeys.find((item) => item.id === settings.activeGeminiKeyId) ??
    settings.geminiKeys[0] ??
    null;
  const apiKey = (activeKey?.apiKey ?? settings.geminiApiKey).trim();

  if (!apiKey) {
    throw new Error("No Gemini API key configured.");
  }

  const model = settings.geminiModel.trim();
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(
    model
  )}:generateContent`;

  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-goog-api-key": apiKey
    },
    body: JSON.stringify({
      contents: [
        {
          parts: [{ text: buildOpenAIPrompt(settings.promptTemplate, text) }]
        }
      ]
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Gemini request failed: ${errorText}`);
  }

  const payload = (await response.json()) as GeminiGenerateContentResponse;
  const options = extractTranslationOptions(getGeminiResponseText(payload));

  if (!options.length) {
    throw new Error("Gemini did not return translation options.");
  }

  return options.slice(0, 3);
}
