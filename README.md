<div align="center">
  <img src="./src/assets/icon-128.png" alt="Translate Extension Logo" width="128" />
  <h1>Translate Extension</h1>
</div>

A Chrome Extension for quick website translation with two translation flows:

- `Vietnamese -> English`: uses OpenAI and returns `3` English translation options.
- `Any other language -> Vietnamese`: auto-detects the source language and translates it into Vietnamese.

The extension includes:

- An on-page translation modal
- A Dashboard and Settings page
- OpenAI API key management
- Custom model and prompt template configuration

## Features

- Select text on any webpage and press `Shift` to open the translation modal
- Show translation near the selected text
- **Multi-Provider AI**: Choose between OpenAI and Google Gemini for high-quality translations
- **Vietnamese -> English AI Options**: Toggle AI options right from the Dashboard
- **Theming**: Pick your preferred popup style (Transparent glass, White panel, Dark glass)
- **Settings Dashboard**: Manage API keys, select models, configure prompts, and view toast notifications in a modern UI
- Copy original or translated text
- Read original and translated text aloud
- Toggle speech on/off from the same button
- Stop speech automatically when the modal closes
- Keep the modal inside the viewport, even near the bottom of the screen

## Tech Stack

- `Chrome Extension Manifest V3`
- `TypeScript`
- `React`
- `Tailwind CSS`
- `Vite`
- `Vitest`
- `Lucide`
- `cross-env`

## Project Structure

```text
src/
  background/    background translation flow and OpenAI integration
  content/       content script and floating translation modal
  options/       dashboard and settings page
  shared/        shared types, storage, prompt builder, language helpers
tests/           unit tests
```

## Installation

### 1. Install dependencies

```bash
npm install
```

### 2. Run tests

```bash
npm test
```

### 3. Build the extension

```bash
npm run build
```

Build output is generated in [dist](/Users/minhphan46/Desktop/Projects/translate-extension/dist).

## Load the Extension in Chrome

1. Open `chrome://extensions`
2. Turn on `Developer mode`
3. Click `Load unpacked`
4. Select [dist](/Users/minhphan46/Desktop/Projects/translate-extension/dist)

## Configuration

### Open the settings page

You can open the settings page in either of these ways:

1. From the Chrome extension details page, click `Extension options`
2. From the translation modal, click the `Settings` icon

### Add an API key

In the `Settings` tab:

1. Select your preferred provider (OpenAI or Gemini)
2. Enter a label for your key
3. Enter your API key
4. Enter the model name (e.g., `gpt-4o-mini` or `gemini-2.5-flash`)
5. Optionally enter a custom prompt template
6. Click `Save` and look for the success Toast notification

### Prompt template

If the prompt template is empty, the extension uses the default prompt from [prompt.ts](/Users/minhphan46/Desktop/Projects/translate-extension/src/shared/prompt.ts).

For custom prompts, include `{{text}}` where the selected text should be inserted.

Example:

```text
Translate the following Vietnamese text into 3 natural English options:
{{text}}
```

## How to Use

### Translate text on a webpage

1. Select any text on a webpage
2. Press `Shift`
3. The translation modal will appear near the selected text

### Translation behavior

#### Vietnamese to English

- Uses OpenAI
- Returns `3` English options
- Lets the user choose the best option

#### Other languages to Vietnamese

- Auto-detects the source language
- Uses Google Translate endpoint with `sl=auto`
- Returns a Vietnamese translation

### Modal actions

The modal supports:

- `Speak original`
- `Copy original`
- `Speak translation`
- `Copy translation`
- `Open settings`

Speech behavior:

- Click the speaker icon once to start reading
- Click the same speaker icon again to stop
- If the modal closes, speech stops automatically

## Development Commands

```bash
npm install
npm test
npm run build
```

## Important Files

- Manifest: [manifest.json](/Users/minhphan46/Desktop/Projects/translate-extension/src/manifest.json)
- Background translator: [translator.ts](/Users/minhphan46/Desktop/Projects/translate-extension/src/background/translator.ts)
- OpenAI integration: [openai.ts](/Users/minhphan46/Desktop/Projects/translate-extension/src/background/openai.ts)
- Content script: [index.ts](/Users/minhphan46/Desktop/Projects/translate-extension/src/content/index.ts)
- Floating modal UI: [overlay.ts](/Users/minhphan46/Desktop/Projects/translate-extension/src/content/overlay.ts)
- Dashboard and settings UI: [App.tsx](/Users/minhphan46/Desktop/Projects/translate-extension/src/options/App.tsx)

## Notes

## Notes

- `Vietnamese -> English` requires a valid API key (OpenAI or Gemini)
- `Foreign language -> Vietnamese` does not require an API key
- The current shortcut is `Shift`
- The modal is positioned near the selected text and stays within the viewport

## Testing

The project follows a TDD-style workflow for core logic.

Current test coverage includes:

- language direction detection
- prompt generation
- OpenAI option parsing
- settings storage
- modal rendering
- modal loading and update flow
- modal viewport positioning
- speaker state switching
