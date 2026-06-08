<div align="center">
  <img src="./src/assets/icon-128.png" alt="Translate Extension Logo" width="128" />
  <h1>Translate Extension</h1>
  <p><strong>A modern, AI-powered Chrome Extension for seamless webpage translation.</strong></p>

  <p>
    <img src="https://img.shields.io/badge/Manifest-V3-blue?style=for-the-badge&logo=google-chrome&logoColor=white" alt="Manifest V3" />
    <img src="https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB" alt="React" />
    <img src="https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript" />
    <img src="https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white" alt="Tailwind CSS" />
    <img src="https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white" alt="Vite" />
  </p>
</div>

---

## 📖 Overview

**Translate Extension** is a feature-rich, beautiful Chrome Extension designed to translate webpage text on the fly. It supports two main translation pipelines:

- 🔄 **Vietnamese ➔ English**: Powered by state-of-the-art AI (OpenAI & Google Gemini), returning **3 distinct translation options** so you can pick the most natural phrasing.
- 🌐 **Any Other Language ➔ Vietnamese**: Auto-detects the source language and translates it instantly into Vietnamese using Google Translate.

---

## ✨ Features

- 🖱️ **Instant Translation**: Simply highlight text on any page and press the `Shift` key to open the floating modal.
- 🤖 **Multi-Provider AI**: Configure and toggle between **OpenAI** (e.g., `gpt-4o-mini`) and **Google Gemini** (e.g., `gemini-2.5-flash`).
- 🎛️ **Dashboard Switch**: Quickly enable/disable AI options for Vietnamese-to-English translation directly from the main panel.
- 🎨 **Custom Themes**: Choose from three eye-catching popup styles:
  - 🧊 *Transparent Glass* (Glassmorphism effect)
  - ⬜ *White Panel* (Sleek minimalist look)
  - ⬛ *Dark Glass* (Elegant dark mode glassmorphic style)
- ⚙️ **Modern Options Dashboard**: Customize prompts, manage API keys, choose models, and receive clean toast notifications.
- 📋 **Copy Actions**: One-click copying for both original and translated texts.
- 🔊 **Text-to-Speech (TTS)**: Read text aloud with toggles to play/stop and auto-stop when the modal is closed.
- 📐 **Smart Viewport Positioning**: The floating modal always aligns itself beautifully and stays within the screen boundaries.

---

## 🛠️ Tech Stack

- **Extension Framework**: Chrome Extension Manifest V3
- **Frontend & Logic**: React + TypeScript
- **Styling**: Tailwind CSS
- **Build Tool**: Vite (powered by `cross-env` for cross-platform compatibility)
- **Icons & UI Elements**: Lucide React
- **Testing**: Vitest

---

## 📂 Project Structure

```text
src/
  ├── background/   # Service worker, routing, and OpenAI/Gemini integration
  ├── content/      # Content script and the floating viewport-aware modal
  ├── options/      # Modern options/dashboard interface
  └── shared/       # Common types, chrome storage helpers, and prompt builder
tests/              # Comprehensive test suites for translation logic and UI components
```

---

## 🚀 Getting Started

### 1. Install Dependencies
```bash
npm install
```

### 2. Run Tests
Ensure everything is working correctly by running unit tests:
```bash
npm test
```

### 3. Build the Extension
Build the distribution files:
```bash
npm run build
```
The built files will be outputted to the [dist](file:///Users/minhphan46/Desktop/Projects/translate-extension/dist) directory.

### 4. Load in Chrome
1. Navigate to `chrome://extensions/` in your browser.
2. Enable **Developer mode** (top-right toggle).
3. Click **Load unpacked** (top-left button).
4. Select the build output directory: [dist](file:///Users/minhphan46/Desktop/Projects/translate-extension/dist).

---

## ⚙️ Configuration & Setup

### Accessing Settings
You can access the configuration dashboard in two ways:
1. Click the **Settings (gear)** icon directly inside the floating translation modal.
2. Go to the extension details page in Chrome and click **Extension options**.

### Configuring API Keys
Inside the **Settings** tab:
1. Select your preferred provider (**OpenAI** or **Gemini**).
2. Provide a name/label for the key.
3. Enter your private **API Key**.
4. Specify the **Model** name (e.g., `gpt-4o-mini`, `gemini-2.5-flash`).
5. *Optional*: Provide a custom prompt template.
6. Click **Save** to apply. A toast notification will confirm whether the configuration was updated successfully.

> [!NOTE]
> Custom prompt templates must include `{{text}}` to define where the selected text is inserted.
>
> **Example Custom Prompt:**
> ```text
> Translate the following Vietnamese text into 3 natural English options:
> {{text}}
> ```
> If left blank, the extension defaults to the template defined in [prompt.ts](file:///Users/minhphan46/Desktop/Projects/translate-extension/src/shared/prompt.ts).

---

## 💡 Usage Guide

### Translation Workflow
1. Select any text on a webpage.
2. Press the `Shift` key.
3. The translation modal will pop up right next to your selection.

### Smart Routing
- **Vietnamese ➔ English**: Triggers the AI model of your choice to output 3 distinct English translations.
- **Other Languages ➔ Vietnamese**: Bypasses AI to perform a rapid translation using the Google Translate engine.

---

## 🔍 Core Source Code Map

- **Manifest Configuration**: [manifest.json](file:///Users/minhphan46/Desktop/Projects/translate-extension/src/manifest.json)
- **Background Orchestrator**: [translator.ts](file:///Users/minhphan46/Desktop/Projects/translate-extension/src/background/translator.ts)
- **AI Translators**: [openai.ts](file:///Users/minhphan46/Desktop/Projects/translate-extension/src/background/openai.ts)
- **Content Script Loader**: [index.ts](file:///Users/minhphan46/Desktop/Projects/translate-extension/src/content/index.ts)
- **Modal View Renderer**: [overlay.ts](file:///Users/minhphan46/Desktop/Projects/translate-extension/src/content/overlay.ts)
- **Dashboard & Options UI**: [App.tsx](file:///Users/minhphan46/Desktop/Projects/translate-extension/src/options/App.tsx)

---

## 🧪 Testing Coverage

The codebase utilizes unit tests verifying core logic under TDD guidelines:
- Language direction and translation flow routing.
- Custom AI prompt rendering and formatting.
- OpenAI/Gemini response parsing logic.
- Storage layer updates & configuration retrieval.
- Floating modal rendering and positioning within the viewport.
- Dynamic text-to-speech speaker toggle state management.

---

> [!IMPORTANT]
> - Translating from Vietnamese to English requires a valid API key (OpenAI or Gemini) configured in the settings dashboard.
> - Translating foreign languages into Vietnamese is completely free and requires no API setup.
