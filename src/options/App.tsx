import { useEffect, useMemo, useState } from "react";
import { createId } from "../shared/id";
import { DEFAULT_PROMPT_TEMPLATE } from "../shared/prompt";
import { DEFAULT_MODEL, extensionStorage } from "../shared/storage";
import type { ApiKeyRecord, ExtensionSettings } from "../shared/types";

type ActiveTab = "dashboard" | "settings";

const EMPTY_KEY = "";

const baseCard =
  "rounded-[28px] border border-white/80 bg-white/80 shadow-glow backdrop-blur supports-[backdrop-filter]:bg-white/75";

function createEmptyState(): ExtensionSettings {
  return {
    keys: [],
    activeKeyId: EMPTY_KEY,
    model: DEFAULT_MODEL,
    promptTemplate: ""
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
  const [apiKey, setApiKey] = useState("");
  const [model, setModel] = useState(DEFAULT_MODEL);
  const [promptTemplate, setPromptTemplate] = useState("");
  const [status, setStatus] = useState("Ready");

  useEffect(() => {
    void (async () => {
      const nextSettings = await extensionStorage.getSettings();
      setSettings(nextSettings);
      setModel(nextSettings.model);
      setPromptTemplate(nextSettings.promptTemplate);
    })();
  }, []);

  const activeKey = useMemo(
    () => settings.keys.find((item) => item.id === settings.activeKeyId) ?? settings.keys[0] ?? null,
    [settings]
  );

  async function saveSettings(nextSettings: ExtensionSettings): Promise<void> {
    await extensionStorage.saveSettings(nextSettings);
    setSettings(nextSettings);
    setStatus("Saved");
  }

  async function handleAddKey(): Promise<void> {
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
      promptTemplate
    };

    await saveSettings(nextSettings);
    setApiKey("");
    setLabel("Primary Key");
  }

  async function handleActivate(id: string): Promise<void> {
    await saveSettings({ ...settings, activeKeyId: id, model, promptTemplate });
  }

  async function handleSavePreferences(): Promise<void> {
    await saveSettings({ ...settings, model, promptTemplate });
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
                  Select text, press <span className="font-semibold text-white">Ctrl</span>, get polished
                  translation fast. Vietnamese to English uses OpenAI. English to Vietnamese uses
                  translation library.
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
                    <div className="rounded-full bg-teal-50 px-4 py-2 text-sm font-semibold text-teal-700">
                      {activeKey ? `Active: ${activeKey.label}` : "No active key"}
                    </div>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                    {settings.keys.length ? (
                      settings.keys.map((item) => (
                        <article key={item.id} className="rounded-[24px] border border-slate-200 bg-white p-5">
                          <div className="flex items-center justify-between">
                            <h3 className="text-lg font-semibold text-slate-900">{item.label}</h3>
                            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.25em] text-slate-500">
                              {item.id === settings.activeKeyId ? "Active" : "Stored"}
                            </span>
                          </div>
                          <p className="mt-4 font-mono text-sm text-slate-600">{maskKey(item.apiKey)}</p>
                          <p className="mt-3 text-xs text-slate-400">
                            Added {new Date(item.createdAt).toLocaleString()}
                          </p>
                          <button
                            type="button"
                            onClick={() => void handleActivate(item.id)}
                            className="mt-5 rounded-2xl bg-slate-950 px-4 py-2 text-sm font-semibold text-white transition hover:bg-teal-700"
                          >
                            Use this key
                          </button>
                        </article>
                      ))
                    ) : (
                      <article className="rounded-[24px] border border-dashed border-slate-300 bg-white/70 p-6 text-sm text-slate-500">
                        No API key yet. Open Settings tab, add key, save, done.
                      </article>
                    )}
                  </div>

                  <div className="mt-8 grid gap-4 lg:grid-cols-2">
                    <div className="rounded-[24px] border border-slate-200 bg-white p-6">
                      <h3 className="text-lg font-semibold text-slate-900">Active model</h3>
                      <p className="mt-3 text-sm text-slate-600">{settings.model}</p>
                    </div>
                    <div className="rounded-[24px] border border-slate-200 bg-white p-6">
                      <h3 className="text-lg font-semibold text-slate-900">Prompt template</h3>
                      <p className="mt-3 whitespace-pre-wrap text-sm text-slate-600">
                        {settings.promptTemplate || DEFAULT_PROMPT_TEMPLATE}
                      </p>
                    </div>
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

                  <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
                    <section className="rounded-[24px] border border-slate-200 bg-white p-6">
                      <h3 className="text-lg font-semibold text-slate-900">Add API key</h3>
                      <div className="mt-5 grid gap-4">
                        <label className="grid gap-2 text-sm font-semibold text-slate-700">
                          Label
                          <input
                            value={label}
                            onChange={(event) => setLabel(event.target.value)}
                            className="rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none ring-0 transition focus:border-teal-500"
                            placeholder="Primary Key"
                          />
                        </label>
                        <label className="grid gap-2 text-sm font-semibold text-slate-700">
                          Input API key OpenAI
                          <input
                            value={apiKey}
                            onChange={(event) => setApiKey(event.target.value)}
                            className="rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none ring-0 transition focus:border-teal-500"
                            placeholder="sk-..."
                          />
                        </label>
                        <button
                          type="button"
                          onClick={() => void handleAddKey()}
                          className="rounded-2xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-teal-700"
                        >
                          Add API Key
                        </button>
                      </div>
                    </section>

                    <section className="rounded-[24px] border border-slate-200 bg-white p-6">
                      <h3 className="text-lg font-semibold text-slate-900">Model & prompt</h3>
                      <div className="mt-5 grid gap-4">
                        <label className="grid gap-2 text-sm font-semibold text-slate-700">
                          Model
                          <input
                            value={model}
                            onChange={(event) => setModel(event.target.value)}
                            className="rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none ring-0 transition focus:border-teal-500"
                            placeholder={DEFAULT_MODEL}
                          />
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
