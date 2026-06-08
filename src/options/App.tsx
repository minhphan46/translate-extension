import { useEffect, useMemo, useState } from "react";
import { createId } from "../shared/id";
import { DEFAULT_PROMPT_TEMPLATE } from "../shared/prompt";
import {
  DEFAULT_GEMINI_MODEL,
  DEFAULT_MODEL,
  GEMINI_MODELS,
  OPENAI_MODELS,
  extensionStorage
} from "../shared/storage";
import type { ApiKeyRecord, ExtensionSettings, OverlayTheme, TranslationAiProvider } from "../shared/types";

type ActiveTab = "dashboard" | "settings";

const EMPTY_KEY = "";

const baseCard =
  "rounded-[28px] border border-white/80 bg-white/80 shadow-glow backdrop-blur supports-[backdrop-filter]:bg-white/75";

function createEmptyState(): ExtensionSettings {
  return {
    keys: [],
    activeKeyId: EMPTY_KEY,
    model: DEFAULT_MODEL,
    aiProvider: "openai",
    geminiKeys: [],
    activeGeminiKeyId: EMPTY_KEY,
    geminiApiKey: "",
    geminiModel: DEFAULT_GEMINI_MODEL,
    promptTemplate: "",
    enableAiVietnameseToEnglishOptions: false,
    overlayTheme: "transparent"
  };
}

function maskKey(apiKey: string): string {
  if (apiKey.length <= 8) {
    return apiKey;
  }

  return `${apiKey.slice(0, 5)}...${apiKey.slice(-4)}`;
}

export function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>("dashboard");
  const [settings, setSettings] = useState<ExtensionSettings>(createEmptyState);
  const [label, setLabel] = useState("Primary Key");
  const [geminiLabel, setGeminiLabel] = useState("Gemini Key");
  const [apiKey, setApiKey] = useState("");
  const [model, setModel] = useState(DEFAULT_MODEL);
  const [aiProvider, setAiProvider] = useState<TranslationAiProvider>("openai");
  const [geminiApiKey, setGeminiApiKey] = useState("");
  const [geminiModel, setGeminiModel] = useState(DEFAULT_GEMINI_MODEL);
  const [promptTemplate, setPromptTemplate] = useState("");
  const [enableAiVietnameseToEnglishOptions, setEnableAiVietnameseToEnglishOptions] = useState(false);
  const [overlayTheme, setOverlayTheme] = useState<OverlayTheme>("transparent");
  const [status, setStatus] = useState("Ready");

  useEffect(() => {
    void (async () => {
      const nextSettings = await extensionStorage.getSettings();
      setSettings(nextSettings);
      setModel(nextSettings.model);
      setAiProvider(nextSettings.aiProvider);
      setGeminiApiKey("");
      setGeminiModel(nextSettings.geminiModel);
      setPromptTemplate(nextSettings.promptTemplate);
      setEnableAiVietnameseToEnglishOptions(nextSettings.enableAiVietnameseToEnglishOptions);
      setOverlayTheme(nextSettings.overlayTheme);
    })();
  }, []);

  const activeKey = useMemo(
    () => settings.keys.find((item) => item.id === settings.activeKeyId) ?? settings.keys[0] ?? null,
    [settings]
  );
  const activeGeminiKey = useMemo(
    () =>
      settings.geminiKeys.find((item) => item.id === settings.activeGeminiKeyId) ??
      settings.geminiKeys[0] ??
      null,
    [settings]
  );
  const selectedProviderLabel = aiProvider === "gemini" ? "Gemini" : "OpenAI";
  const dashboardKeys = settings.aiProvider === "gemini" ? settings.geminiKeys : settings.keys;
  const activeDashboardKeyId =
    settings.aiProvider === "gemini" ? settings.activeGeminiKeyId : settings.activeKeyId;
  const modelOptions = aiProvider === "gemini" ? GEMINI_MODELS : OPENAI_MODELS;
  const selectedModel = aiProvider === "gemini" ? geminiModel : model;

  async function saveSettings(nextSettings: ExtensionSettings): Promise<void> {
    await extensionStorage.saveSettings(nextSettings);
    setSettings(nextSettings);
    setStatus("Saved");
  }

  async function handleAddKey(): Promise<void> {
    if (aiProvider === "gemini") {
      if (!geminiApiKey.trim()) {
        setStatus("Gemini API key required");
        return;
      }

      const nextKey: ApiKeyRecord = {
        id: createId(),
        label: geminiLabel.trim() || "Gemini Key",
        apiKey: geminiApiKey.trim(),
        createdAt: new Date().toISOString()
      };
      const nextGeminiKeys = [nextKey, ...settings.geminiKeys];

      await saveSettings({
        ...settings,
        aiProvider,
        geminiKeys: nextGeminiKeys,
        activeGeminiKeyId: settings.activeGeminiKeyId || nextKey.id,
        geminiApiKey: settings.geminiApiKey || nextKey.apiKey,
        geminiModel: geminiModel.trim() || DEFAULT_GEMINI_MODEL,
        model,
        promptTemplate,
        enableAiVietnameseToEnglishOptions,
        overlayTheme
      });
      setGeminiApiKey("");
      setGeminiLabel("Gemini Key");
      return;
    }

    if (!apiKey.trim()) {
      setStatus("OpenAI API key required");
      return;
    }

    const nextKey: ApiKeyRecord = {
      id: createId(),
      label: label.trim() || "Primary Key",
      apiKey: apiKey.trim(),
      createdAt: new Date().toISOString()
    };

    const nextSettings: ExtensionSettings = {
      keys: [nextKey, ...settings.keys],
      activeKeyId: settings.activeKeyId || nextKey.id,
      model,
      aiProvider,
      geminiKeys: settings.geminiKeys,
      activeGeminiKeyId: settings.activeGeminiKeyId,
      geminiApiKey: activeGeminiKey?.apiKey ?? settings.geminiApiKey,
      geminiModel: geminiModel.trim() || DEFAULT_GEMINI_MODEL,
      promptTemplate,
      enableAiVietnameseToEnglishOptions,
      overlayTheme
    };

    await saveSettings(nextSettings);
    setApiKey("");
    setLabel("Primary Key");
  }

  async function handleActivate(id: string, provider: TranslationAiProvider): Promise<void> {
    const nextGeminiKey =
      provider === "gemini"
        ? settings.geminiKeys.find((item) => item.id === id) ?? null
        : activeGeminiKey;

    await saveSettings({
      ...settings,
      activeKeyId: provider === "openai" ? id : settings.activeKeyId,
      activeGeminiKeyId: provider === "gemini" ? id : settings.activeGeminiKeyId,
      model,
      aiProvider,
      geminiApiKey: nextGeminiKey?.apiKey ?? settings.geminiApiKey,
      geminiModel: geminiModel.trim() || DEFAULT_GEMINI_MODEL,
      promptTemplate,
      enableAiVietnameseToEnglishOptions,
      overlayTheme
    });
  }

  async function handleDeleteKey(id: string, provider: TranslationAiProvider): Promise<void> {
    if (provider === "gemini") {
      const nextGeminiKeys = settings.geminiKeys.filter((item) => item.id !== id);
      const nextActiveGeminiKeyId =
        settings.activeGeminiKeyId === id
          ? nextGeminiKeys[0]?.id ?? ""
          : settings.activeGeminiKeyId;
      const nextActiveGeminiKey =
        nextGeminiKeys.find((item) => item.id === nextActiveGeminiKeyId) ??
        nextGeminiKeys[0] ??
        null;

      await saveSettings({
        ...settings,
        geminiKeys: nextGeminiKeys,
        activeGeminiKeyId: nextActiveGeminiKeyId,
        geminiApiKey: nextActiveGeminiKey?.apiKey ?? "",
        model,
        aiProvider,
        geminiModel: geminiModel.trim() || DEFAULT_GEMINI_MODEL,
        promptTemplate,
        enableAiVietnameseToEnglishOptions,
        overlayTheme
      });
      setStatus("Deleted Gemini key");
      return;
    }

    const nextKeys = settings.keys.filter((item) => item.id !== id);
    const nextActiveKeyId =
      settings.activeKeyId === id ? nextKeys[0]?.id ?? "" : settings.activeKeyId;

    await saveSettings({
      ...settings,
      keys: nextKeys,
      activeKeyId: nextActiveKeyId,
      model,
      aiProvider,
      geminiApiKey: activeGeminiKey?.apiKey ?? settings.geminiApiKey,
      geminiModel: geminiModel.trim() || DEFAULT_GEMINI_MODEL,
      promptTemplate,
      enableAiVietnameseToEnglishOptions,
      overlayTheme
    });
    setStatus("Deleted OpenAI key");
  }

  async function handleSelectProvider(nextProvider: TranslationAiProvider): Promise<void> {
    setAiProvider(nextProvider);
    await saveSettings({
      ...settings,
      aiProvider: nextProvider,
      geminiApiKey: activeGeminiKey?.apiKey ?? settings.geminiApiKey,
      geminiModel: geminiModel.trim() || DEFAULT_GEMINI_MODEL,
      model,
      promptTemplate,
      enableAiVietnameseToEnglishOptions,
      overlayTheme
    });
  }

  async function handleSelectOverlayTheme(nextTheme: OverlayTheme): Promise<void> {
    setOverlayTheme(nextTheme);
    await saveSettings({
      ...settings,
      model,
      aiProvider,
      geminiApiKey: activeGeminiKey?.apiKey ?? settings.geminiApiKey,
      geminiModel: geminiModel.trim() || DEFAULT_GEMINI_MODEL,
      promptTemplate,
      enableAiVietnameseToEnglishOptions,
      overlayTheme: nextTheme
    });
  }

  async function handleSavePreferences(): Promise<void> {
    await saveSettings({
      ...settings,
      model,
      aiProvider,
      geminiApiKey: activeGeminiKey?.apiKey ?? settings.geminiApiKey,
      geminiModel: geminiModel.trim() || DEFAULT_GEMINI_MODEL,
      promptTemplate,
      enableAiVietnameseToEnglishOptions,
      overlayTheme
    });
  }

  return (
    <main className="min-h-screen bg-mesh px-6 py-10 font-body text-ink">
      <div className="mx-auto max-w-6xl">
        <section className={`${baseCard} overflow-hidden`}>
          <div className="grid gap-0 lg:grid-cols-[280px_1fr]">
            <aside className="border-b border-white/70 bg-slate-950 px-8 py-10 text-white lg:border-b-0 lg:border-r">
              <div className="max-w-xs">
                <div className="mb-4 inline-flex rounded-full border border-white/20 px-3 py-1 text-xs uppercase tracking-[0.35em] text-cyan-200">
                  Translate Hub
                </div>
                <h1 className="font-display text-4xl font-semibold leading-tight">
                  Chrome translation workflow for daily browsing.
                </h1>
                <p className="mt-4 text-sm leading-7 text-slate-300">
                  Select text, press <span className="font-semibold text-white">Shift</span>, get polished
                  translation fast. Vietnamese to English can use AI options or fallback translation.
                  Other languages auto-detect and translate to Vietnamese.
                </p>
                <div className="mt-8 flex flex-col gap-3">
                  <button
                    type="button"
                    onClick={() => setActiveTab("dashboard")}
                    className={`rounded-2xl px-4 py-3 text-left text-sm font-semibold transition ${
                      activeTab === "dashboard"
                        ? "bg-white text-slate-950"
                        : "bg-white/10 text-slate-200 hover:bg-white/20"
                    }`}
                  >
                    Dashboard
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab("settings")}
                    className={`rounded-2xl px-4 py-3 text-left text-sm font-semibold transition ${
                      activeTab === "settings"
                        ? "bg-white text-slate-950"
                        : "bg-white/10 text-slate-200 hover:bg-white/20"
                    }`}
                  >
                    Settings
                  </button>
                </div>
              </div>
            </aside>

            <section className="px-6 py-8 sm:px-8 lg:px-10">
              {activeTab === "dashboard" ? (
                <div>
                  <div className="mb-6 flex items-center justify-between">
                    <div>
                      <h2 className="font-display text-3xl font-semibold">Dashboard</h2>
                      <p className="mt-2 text-sm text-slate-500">Configured API keys and active model.</p>
                    </div>
                    <div className="flex gap-2">
                    <div
                      className={`rounded-full px-4 py-2 text-sm font-semibold ${
                        settings.enableAiVietnameseToEnglishOptions
                          ? "bg-green-50 text-green-700"
                          : "bg-red-50 text-red-700"
                      }`}
                    >
                      {settings.enableAiVietnameseToEnglishOptions ? "AI Enabled" : "AI Disabled"}
                    </div>
                    <div className="rounded-full bg-teal-50 px-4 py-2 text-sm font-semibold text-teal-700">
                      {settings.aiProvider === "gemini"
                        ? activeGeminiKey
                          ? `Active: ${activeGeminiKey.label}`
                          : "No Gemini key"
                        : activeKey
                          ? `Active: ${activeKey.label}`
                          : "No active key"}
                    </div>
                    </div>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                    {dashboardKeys.length ? (
                      dashboardKeys.map((item) => (
                        <article key={item.id} className="rounded-[24px] border border-slate-200 bg-white p-5">
                          <div className="flex items-center justify-between">
                            <h3 className="text-lg font-semibold text-slate-900">{item.label}</h3>
                            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.25em] text-slate-500">
                              {item.id === activeDashboardKeyId ? "Active" : "Stored"}
                            </span>
                          </div>
                          <p className="mt-4 font-mono text-sm text-slate-600">{maskKey(item.apiKey)}</p>
                          <p className="mt-3 text-xs text-slate-400">
                            Added {new Date(item.createdAt).toLocaleString()}
                          </p>
                          <div className="mt-5 flex flex-wrap gap-2">
                            <button
                              type="button"
                              onClick={() => void handleActivate(item.id, settings.aiProvider)}
                              className="rounded-2xl bg-slate-950 px-4 py-2 text-sm font-semibold text-white transition hover:bg-teal-700"
                            >
                              Use this key
                            </button>
                            <button
                              type="button"
                              onClick={() => void handleDeleteKey(item.id, settings.aiProvider)}
                              className="rounded-2xl border border-red-100 bg-red-50 px-4 py-2 text-sm font-semibold text-red-700 transition hover:border-red-200 hover:bg-red-100"
                            >
                              Delete
                            </button>
                          </div>
                        </article>
                      ))
                    ) : (
                      <article className="rounded-[24px] border border-dashed border-slate-300 bg-white/70 p-6 text-sm text-slate-500">
                        No {settings.aiProvider === "gemini" ? "Gemini" : "OpenAI"} API key yet. Open Settings tab, add key, save, done.
                      </article>
                    )}
                  </div>

                  <div className="mt-8 grid gap-4 lg:grid-cols-2">
                    <div className="rounded-[24px] border border-slate-200 bg-white p-6">
                      <h3 className="text-lg font-semibold text-slate-900">Active model</h3>
                      <p className="mt-3 text-sm text-slate-600">
                        {settings.aiProvider === "gemini" ? settings.geminiModel : settings.model}
                      </p>
                    </div>
                    <div className="rounded-[24px] border border-slate-200 bg-white p-6">
                      <h3 className="text-lg font-semibold text-slate-900">Prompt template</h3>
                      <p className="mt-3 whitespace-pre-wrap text-sm text-slate-600">
                        {settings.promptTemplate || DEFAULT_PROMPT_TEMPLATE}
                      </p>
                    </div>
                    {/* <div className="rounded-[24px] border border-slate-200 bg-white p-6">
                      <h3 className="text-lg font-semibold text-slate-900">AI English options</h3>
                      <p className="mt-3 text-sm text-slate-600">
                        {settings.enableAiVietnameseToEnglishOptions
                          ? "Enabled. Vietnamese to English can return 3 OpenAI options when API key is available."
                          : "Disabled. Vietnamese to English uses normal translation only."}
                      </p>
                    </div> */}
                  </div>
                </div>
              ) : (
                <div>
                  <div className="mb-6">
                    <h2 className="font-display text-3xl font-semibold">Settings</h2>
                    <p className="mt-2 text-sm text-slate-500">
                      Add OpenAI API key, choose model, tune prompt template.
                    </p>
                  </div>

                  <section className="mb-6 rounded-[24px] border border-slate-200 bg-white p-6">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                      <div>
                        <h3 className="text-lg font-semibold text-slate-900">English AI provider</h3>
                      </div>
                      <div className="rounded-full bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-700">
                        {settings.aiProvider === "gemini" ? "Using Gemini" : "Using OpenAI"}
                      </div>
                    </div>

                    <div className="mt-5 grid gap-3 lg:grid-cols-2">
                        <label className="flex items-start gap-3 rounded-3xl border border-slate-200 px-4 py-4 text-sm text-slate-700">
                          <input
                            type="radio"
                            name="ai-provider"
                            checked={aiProvider === "openai"}
                            onChange={() => void handleSelectProvider("openai")}
                            className="mt-1 h-4 w-4 accent-teal-600"
                          />
                          <span>
                            <span className="block font-semibold text-slate-900">Translate by OpenAI</span>
                          </span>
                        </label>
                        <label className="flex items-start gap-3 rounded-3xl border border-slate-200 px-4 py-4 text-sm text-slate-700">
                          <input
                            type="radio"
                            name="ai-provider"
                            checked={aiProvider === "gemini"}
                            onChange={() => void handleSelectProvider("gemini")}
                            className="mt-1 h-4 w-4 accent-teal-600"
                          />
                          <span>
                            <span className="block font-semibold text-slate-900">Translate by Gemini</span>
                          </span>
                        </label>
                    </div>
                  </section>

                  <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
                    <section className="rounded-[24px] border border-slate-200 bg-white p-6">
                      <h3 className="text-lg font-semibold text-slate-900">Add API key</h3>
                      <div className="mt-5 grid gap-4">
                        <label className="grid gap-2 text-sm font-semibold text-slate-700">
                          Label
                          <input
                            value={aiProvider === "gemini" ? geminiLabel : label}
                            onChange={(event) =>
                              aiProvider === "gemini"
                                ? setGeminiLabel(event.target.value)
                                : setLabel(event.target.value)
                            }
                            className="rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none ring-0 transition focus:border-teal-500"
                            placeholder={aiProvider === "gemini" ? "Gemini Key" : "Primary Key"}
                          />
                        </label>
                        <label className="grid gap-2 text-sm font-semibold text-slate-700">
                          Input API key {selectedProviderLabel}
                          <input
                            value={aiProvider === "gemini" ? geminiApiKey : apiKey}
                            onChange={(event) =>
                              aiProvider === "gemini"
                                ? setGeminiApiKey(event.target.value)
                                : setApiKey(event.target.value)
                            }
                            className="rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none ring-0 transition focus:border-teal-500"
                            placeholder={aiProvider === "gemini" ? "AIza..." : "sk-..."}
                          />
                        </label>
                        <button
                          type="button"
                          onClick={() => void handleAddKey()}
                          className="rounded-2xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-teal-700"
                        >
                          {aiProvider === "gemini" ? "Save Gemini API Key" : "Add OpenAI API Key"}
                        </button>
                      </div>
                    </section>

                    <section className="rounded-[24px] border border-slate-200 bg-white p-6">
                      <h3 className="text-lg font-semibold text-slate-900">Model & prompt</h3>
                      <div className="mt-5 grid gap-4">
                        <label className="grid gap-2 text-sm font-semibold text-slate-700">
                          {selectedProviderLabel} Model
                          <select
                            value={selectedModel}
                            onChange={(event) =>
                              aiProvider === "gemini"
                                ? setGeminiModel(event.target.value)
                                : setModel(event.target.value)
                            }
                            className="rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none ring-0 transition focus:border-teal-500"
                          >
                            {modelOptions.map((item) => (
                              <option key={item} value={item}>
                                {item}
                              </option>
                            ))}
                          </select>
                        </label>
                        <label className="grid gap-2 text-sm font-semibold text-slate-700">
                          Prompt Template
                          <textarea
                            value={promptTemplate}
                            onChange={(event) => setPromptTemplate(event.target.value)}
                            className="min-h-48 rounded-3xl border border-slate-200 px-4 py-3 text-sm outline-none ring-0 transition focus:border-teal-500"
                            placeholder="Use {{text}} for selected content. Leave empty for default prompt."
                          />
                        </label>
                        <label className="flex items-start gap-3 rounded-3xl border border-slate-200 px-4 py-4 text-sm text-slate-700">
                          <input
                            type="checkbox"
                            checked={enableAiVietnameseToEnglishOptions}
                            onChange={(event) =>
                              setEnableAiVietnameseToEnglishOptions(event.target.checked)
                            }
                            className="mt-1 h-4 w-4 accent-teal-600"
                          />
                          <span>
                            <span className="block font-semibold text-slate-900">
                              Enable AI options for Vietnamese to English
                            </span>
                          </span>
                        </label>
                        <button
                          type="button"
                          onClick={() => void handleSavePreferences()}
                          className="rounded-2xl bg-orange-500 px-5 py-3 text-sm font-semibold text-white transition hover:bg-orange-600"
                        >
                          Save
                        </button>
                      </div>
                    </section>
                  </div>

                  <section className="mt-6 rounded-[24px] border border-slate-200 bg-white p-6">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                      <div>
                        <h3 className="text-lg font-semibold text-slate-900">Popup theme</h3>
                      </div>
                      <div className="rounded-full bg-teal-50 px-4 py-2 text-sm font-semibold text-teal-700">
                        {overlayTheme === "transparent" ? "Transparent" : "White"}
                      </div>
                    </div>

                    <div className="mt-5 grid gap-3 lg:grid-cols-2">
                      <label className="flex items-start gap-3 rounded-3xl border border-slate-200 px-4 py-4 text-sm text-slate-700">
                        <input
                          type="radio"
                          name="overlay-theme"
                          checked={overlayTheme === "transparent"}
                          onChange={() => void handleSelectOverlayTheme("transparent")}
                          className="mt-1 h-4 w-4 accent-teal-600"
                        />
                        <span>
                          <span className="block font-semibold text-slate-900">Transparent glass</span>
                        </span>
                      </label>
                      <label className="flex items-start gap-3 rounded-3xl border border-slate-200 px-4 py-4 text-sm text-slate-700">
                        <input
                          type="radio"
                          name="overlay-theme"
                          checked={overlayTheme === "white"}
                          onChange={() => void handleSelectOverlayTheme("white")}
                          className="mt-1 h-4 w-4 accent-teal-600"
                        />
                        <span>
                          <span className="block font-semibold text-slate-900">White panel</span>
                        </span>
                      </label>
                    </div>
                  </section>

                  <div className="mt-6 rounded-[24px] border border-teal-100 bg-teal-50 px-5 py-4 text-sm text-teal-900">
                    Status: {status}
                  </div>
                </div>
              )}
            </section>
          </div>
        </section>
      </div>
    </main>
  );
}
