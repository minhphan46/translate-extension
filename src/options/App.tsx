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
    overlayTheme: "white",
    ttsRate: 1.0,
    ttsVoiceVi: "",
    ttsVolume: 1.0,
    popupWidth: 500,
    fontSize: 13
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
  const [overlayTheme, setOverlayTheme] = useState<OverlayTheme>("white");
  const [ttsRate, setTtsRate] = useState(1.0);
  const [ttsVoiceVi, setTtsVoiceVi] = useState("");
  const [ttsVolume, setTtsVolume] = useState(1.0);
  const [popupWidth, setPopupWidth] = useState(500);
  const [fontSize, setFontSize] = useState(13);
  const [viVoices, setViVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  function showToast(message: string, type: "success" | "error" = "success") {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  }

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
      setTtsRate(nextSettings.ttsRate ?? 1.0);
      setTtsVoiceVi(nextSettings.ttsVoiceVi ?? "");
      setTtsVolume(nextSettings.ttsVolume ?? 1.0);
      setPopupWidth(nextSettings.popupWidth ?? 500);
      setFontSize(nextSettings.fontSize ?? 13);
    })();
  }, []);

  useEffect(() => {
    function loadVoices() {
      const allVoices = window.speechSynthesis.getVoices();
      const filtered = allVoices.filter((v) => v.lang.toLowerCase().startsWith("vi"));
      setViVoices(filtered);
    }
    loadVoices();
    window.speechSynthesis.onvoiceschanged = loadVoices;
    return () => {
      window.speechSynthesis.onvoiceschanged = null;
    };
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
    showToast("Saved successfully");
  }

  async function handleAddKey(): Promise<void> {
    if (aiProvider === "gemini") {
      if (!geminiApiKey.trim()) {
        showToast("Gemini API key required", "error");
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
      showToast("OpenAI API key required", "error");
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
      overlayTheme,
      ttsRate,
      ttsVoiceVi,
      ttsVolume,
      popupWidth,
      fontSize
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
      showToast("Deleted Gemini key");
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
    showToast("Deleted OpenAI key");
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

  async function handleToggleAiOptions(): Promise<void> {
    const nextValue = !enableAiVietnameseToEnglishOptions;
    setEnableAiVietnameseToEnglishOptions(nextValue);
    await saveSettings({
      ...settings,
      model,
      aiProvider,
      geminiApiKey: activeGeminiKey?.apiKey ?? settings.geminiApiKey,
      geminiModel: geminiModel.trim() || DEFAULT_GEMINI_MODEL,
      promptTemplate,
      enableAiVietnameseToEnglishOptions: nextValue,
      overlayTheme
    });
  }

  async function handleSelectTtsRate(nextRate: number): Promise<void> {
    setTtsRate(nextRate);
    await saveSettings({
      ...settings,
      model,
      aiProvider,
      geminiApiKey: activeGeminiKey?.apiKey ?? settings.geminiApiKey,
      geminiModel: geminiModel.trim() || DEFAULT_GEMINI_MODEL,
      promptTemplate,
      enableAiVietnameseToEnglishOptions,
      overlayTheme,
      ttsRate: nextRate,
      ttsVoiceVi,
      ttsVolume,
      popupWidth,
      fontSize
    });
  }

  async function handleSelectTtsVoice(nextVoice: string): Promise<void> {
    setTtsVoiceVi(nextVoice);
    await saveSettings({
      ...settings,
      model,
      aiProvider,
      geminiApiKey: activeGeminiKey?.apiKey ?? settings.geminiApiKey,
      geminiModel: geminiModel.trim() || DEFAULT_GEMINI_MODEL,
      promptTemplate,
      enableAiVietnameseToEnglishOptions,
      overlayTheme,
      ttsRate,
      ttsVoiceVi: nextVoice,
      ttsVolume,
      popupWidth,
      fontSize
    });
  }

  async function handleSelectTtsVolume(nextVolume: number): Promise<void> {
    setTtsVolume(nextVolume);
    await saveSettings({
      ...settings,
      model,
      aiProvider,
      geminiApiKey: activeGeminiKey?.apiKey ?? settings.geminiApiKey,
      geminiModel: geminiModel.trim() || DEFAULT_GEMINI_MODEL,
      promptTemplate,
      enableAiVietnameseToEnglishOptions,
      overlayTheme,
      ttsRate,
      ttsVoiceVi,
      ttsVolume: nextVolume,
      popupWidth,
      fontSize
    });
  }

  async function handleSelectPopupWidth(nextWidth: number): Promise<void> {
    setPopupWidth(nextWidth);
    await saveSettings({
      ...settings,
      model,
      aiProvider,
      geminiApiKey: activeGeminiKey?.apiKey ?? settings.geminiApiKey,
      geminiModel: geminiModel.trim() || DEFAULT_GEMINI_MODEL,
      promptTemplate,
      enableAiVietnameseToEnglishOptions,
      overlayTheme,
      ttsRate,
      ttsVoiceVi,
      ttsVolume,
      popupWidth: nextWidth,
      fontSize
    });
  }

  async function handleSelectFontSize(nextFontSize: number): Promise<void> {
    setFontSize(nextFontSize);
    await saveSettings({
      ...settings,
      model,
      aiProvider,
      geminiApiKey: activeGeminiKey?.apiKey ?? settings.geminiApiKey,
      geminiModel: geminiModel.trim() || DEFAULT_GEMINI_MODEL,
      promptTemplate,
      enableAiVietnameseToEnglishOptions,
      overlayTheme,
      ttsRate,
      ttsVoiceVi,
      ttsVolume,
      popupWidth,
      fontSize: nextFontSize
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
                  <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <h2 className="font-display text-3xl font-semibold">Dashboard</h2>
                      <p className="mt-2 text-sm text-slate-500">Configured API keys and active model.</p>
                      <div className="mt-4 flex items-center gap-3">
                        <button
                          type="button"
                          role="switch"
                          aria-checked={enableAiVietnameseToEnglishOptions}
                          onClick={() => void handleToggleAiOptions()}
                          className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-teal-600 focus:ring-offset-2 ${
                            enableAiVietnameseToEnglishOptions ? "bg-teal-600" : "bg-slate-200"
                          }`}
                        >
                          <span
                            aria-hidden="true"
                            className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                              enableAiVietnameseToEnglishOptions ? "translate-x-5" : "translate-x-0"
                            }`}
                          />
                        </button>
                        <span className="text-sm font-medium text-slate-700">
                          Enable AI options for Vietnamese to English
                        </span>
                      </div>
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
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between mb-4">
                      <div>
                        <h3 className="text-lg font-semibold text-slate-900">Voice & Speed (TTS)</h3>
                        <p className="mt-1 text-sm text-slate-500">Customize speech speed, volume, and choose a Vietnamese voice.</p>
                      </div>
                    </div>

                    <div className="grid gap-6 md:grid-cols-2">
                      <div className="flex flex-col gap-6">
                        <div className="flex flex-col gap-2">
                          <label className="text-sm font-semibold text-slate-700">
                            Speed: <span className="text-teal-600 font-bold">{ttsRate}x</span>
                          </label>
                          <div className="flex items-center gap-3 mt-1">
                            <span className="text-xs text-slate-400">0.5x</span>
                            <input
                              type="range"
                              min="0.5"
                              max="2.0"
                              step="0.1"
                              value={ttsRate}
                              onChange={(e) => void handleSelectTtsRate(parseFloat(e.target.value))}
                              className="h-2 w-full cursor-pointer appearance-none rounded-lg bg-slate-200 accent-teal-600 focus:outline-none"
                            />
                            <span className="text-xs text-slate-400">2.0x</span>
                          </div>
                          <div className="flex justify-between text-[10px] text-slate-400 px-6">
                            <span>Slow</span>
                            <span>1.0x (Default)</span>
                            <span>Fast</span>
                          </div>
                        </div>

                        <div className="flex flex-col gap-2">
                          <label className="text-sm font-semibold text-slate-700">
                            Volume: <span className="text-teal-600 font-bold">{Math.round(ttsVolume * 100)}%</span>
                          </label>
                          <div className="flex items-center gap-3 mt-1">
                            <span className="text-xs text-slate-400">0%</span>
                            <input
                              type="range"
                              min="0.0"
                              max="1.0"
                              step="0.1"
                              value={ttsVolume}
                              onChange={(e) => void handleSelectTtsVolume(parseFloat(e.target.value))}
                              className="h-2 w-full cursor-pointer appearance-none rounded-lg bg-slate-200 accent-teal-600 focus:outline-none"
                            />
                            <span className="text-xs text-slate-400">100%</span>
                          </div>
                          <div className="flex justify-between text-[10px] text-slate-400 px-6">
                            <span>Muted</span>
                            <span>50%</span>
                            <span>Max</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-col gap-2">
                        <label className="text-sm font-semibold text-slate-700">Vietnamese Voice</label>
                        <select
                          value={ttsVoiceVi}
                          onChange={(e) => void handleSelectTtsVoice(e.target.value)}
                          className="rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none ring-0 transition focus:border-teal-500"
                        >
                          <option value="">System Default Voice</option>
                          {viVoices.map((voice) => (
                            <option key={voice.name} value={voice.name}>
                              {voice.name} ({voice.lang})
                            </option>
                          ))}
                        </select>
                        <p className="text-xs text-slate-400 mt-1">
                          List of voices is retrieved from your device. On macOS, you can add Vietnamese voices in System Settings.
                        </p>
                      </div>
                    </div>
                  </section>

                  <section className="mt-6 rounded-[24px] border border-slate-200 bg-white p-6">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between mb-4">
                      <div>
                        <h3 className="text-lg font-semibold text-slate-900">Popup Appearance</h3>
                        <p className="mt-1 text-sm text-slate-500">Customize the look and layout of the translation popup card.</p>
                      </div>
                    </div>

                    <div className="grid gap-6 md:grid-cols-2">
                      <div className="flex flex-col gap-3">
                        <label className="text-sm font-semibold text-slate-700">Theme</label>
                        <div className="grid gap-2">
                          <label className="flex items-center gap-3 rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-700 cursor-pointer hover:bg-slate-50 transition">
                            <input
                              type="radio"
                              name="overlay-theme"
                              checked={overlayTheme === "transparent"}
                              onChange={() => void handleSelectOverlayTheme("transparent")}
                              className="h-4 w-4 accent-teal-600"
                            />
                            <span className="font-semibold text-slate-900">Transparent glass</span>
                          </label>
                          <label className="flex items-center gap-3 rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-700 cursor-pointer hover:bg-slate-50 transition">
                            <input
                              type="radio"
                              name="overlay-theme"
                              checked={overlayTheme === "white"}
                              onChange={() => void handleSelectOverlayTheme("white")}
                              className="h-4 w-4 accent-teal-600"
                            />
                            <span className="font-semibold text-slate-900">White panel</span>
                          </label>
                          <label className="flex items-center gap-3 rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-700 cursor-pointer hover:bg-slate-50 transition">
                            <input
                              type="radio"
                              name="overlay-theme"
                              checked={overlayTheme === "dark"}
                              onChange={() => void handleSelectOverlayTheme("dark")}
                              className="h-4 w-4 accent-teal-600"
                            />
                            <span className="font-semibold text-slate-900">Dark glass</span>
                          </label>
                        </div>
                      </div>

                      <div className="flex flex-col gap-6">
                        <div className="flex flex-col gap-2">
                          <label className="text-sm font-semibold text-slate-700">
                            Popup Width: <span className="text-teal-600 font-bold">{popupWidth}px</span>
                          </label>
                          <div className="flex items-center gap-3 mt-1">
                            <span className="text-xs text-slate-400">300px</span>
                            <input
                              type="range"
                              min="300"
                              max="800"
                              step="50"
                              value={popupWidth}
                              onChange={(e) => void handleSelectPopupWidth(parseInt(e.target.value))}
                              className="h-2 w-full cursor-pointer appearance-none rounded-lg bg-slate-200 accent-teal-600 focus:outline-none"
                            />
                            <span className="text-xs text-slate-400">800px</span>
                          </div>
                          <div className="flex justify-between text-[10px] text-slate-400 px-6">
                            <span>Narrow</span>
                            <span>500px (Default)</span>
                            <span>Wide</span>
                          </div>
                        </div>

                        <div className="flex flex-col gap-2">
                          <label className="text-sm font-semibold text-slate-700">
                            Font Size: <span className="text-teal-600 font-bold">{fontSize}px</span>
                          </label>
                          <div className="flex items-center gap-3 mt-1">
                            <span className="text-xs text-slate-400">11px</span>
                            <input
                              type="range"
                              min="11"
                              max="20"
                              step="1"
                              value={fontSize}
                              onChange={(e) => void handleSelectFontSize(parseInt(e.target.value))}
                              className="h-2 w-full cursor-pointer appearance-none rounded-lg bg-slate-200 accent-teal-600 focus:outline-none"
                            />
                            <span className="text-xs text-slate-400">20px</span>
                          </div>
                          <div className="flex justify-between text-[10px] text-slate-400 px-6">
                            <span>Small</span>
                            <span>13px (Default)</span>
                            <span>Large</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </section>

                  {toast && (
                    <div className={`fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-2xl px-5 py-3 text-sm font-semibold text-white shadow-xl animate-in fade-in slide-in-from-bottom-4 ${
                      toast.type === "error" ? "bg-red-500" : "bg-slate-800"
                    }`}>
                      {toast.message}
                    </div>
                  )}
                </div>
              )}
            </section>
          </div>
        </section>
      </div>
    </main>
  );
}
