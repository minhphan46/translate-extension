# Translate Extension

Chrome Extension dịch nhanh nội dung trên trang web:

- `VI -> EN`: gọi OpenAI, trả về `3` phương án tiếng Anh để người dùng chọn.
- `Any language -> VI`: tự detect ngôn ngữ nguồn rồi dịch sang tiếng Việt.
- Có `Dashboard` và `Settings` để quản lý API key, model, prompt template.
- Người dùng bôi đen text rồi nhấn `Ctrl` để mở popup dịch ngay trên trang.

## Stack

- `Chrome Extension Manifest V3`
- `TypeScript`
- `React`
- `Tailwind CSS`
- `Vite`
- `Vitest`

## Cấu trúc chính

```text
src/
  background/      service worker, translate flow, gọi OpenAI
  content/         bắt sự kiện chọn text + Ctrl, render popup nổi
  options/         trang Dashboard & Settings
  shared/          type, storage, prompt builder, parser, language detect
tests/             test cho logic cốt lõi
```

## Cài đặt

```bash
npm install
```

## Chạy test

```bash
npm test
```

## Build extension

```bash
npm run build
```

Sau khi build xong, thư mục output là `dist/`.

## Load vào Chrome

1. Mở `chrome://extensions`
2. Bật `Developer mode`
3. Chọn `Load unpacked`
4. Trỏ tới thư mục [dist](/Users/minhphan46/Desktop/Projects/translate-extension/dist)

## Cách dùng

### 1. Mở trang Dashboard / Settings

- Sau khi load extension, vào phần chi tiết extension.
- Chọn `Extension options`.
- Hoặc trong popup dịch, bấm nút `Settings`.

### 2. Thêm OpenAI API Key

Vào tab `Settings`:

1. Nhập `Label`
2. Nhập `Input API Key OpenAI`
3. Nhập `Model`
4. Nhập `Prompt Template` nếu muốn custom
5. Bấm `Save`

Lưu ý:

- Nếu `Prompt Template` để trống, hệ thống dùng prompt mặc định.
- Prompt custom nên chứa placeholder `{{text}}`.

Ví dụ:

```text
Hãy dịch đoạn sau sang tiếng Anh và cho tôi 3 option tự nhiên, ngắn gọn:
{{text}}
```

### 3. Dịch trên trang web

1. Bôi đen đoạn text trên bất kỳ trang web nào
2. Nhấn `Ctrl`
3. Popup nổi sẽ hiện:
   - `Original`
   - `Translated text` hoặc `3 options`
   - nút `Speak`
   - nút `Copy`
   - nút `Settings`

### 4. Hành vi dịch

- Nếu text là tiếng Việt:
  - Extension gọi OpenAI
  - Trả về `3` phương án tiếng Anh
  - Người dùng bấm chọn option muốn dùng
  - Bấm `Copy` để copy option đã chọn

- Nếu text là ngôn ngữ khác tiếng Việt:
  - Extension auto-detect ngôn ngữ nguồn
  - Gọi Google Translate endpoint với `sl=auto`
  - Trả về `1` bản dịch tiếng Việt

## Prompt mặc định

Khi không nhập prompt template, extension dùng prompt mặc định trong [prompt.ts](/Users/minhphan46/Desktop/Projects/translate-extension/src/shared/prompt.ts).

## TDD đã áp dụng

Test được viết cho các phần cốt lõi trước khi nối UI:

- detect hướng dịch `VI/foreign`
- build prompt mặc định / prompt custom
- parse `3` option từ OpenAI response
- storage settings / API key
- hành vi popup copy option đã chọn

Test nằm trong thư mục [tests](/Users/minhphan46/Desktop/Projects/translate-extension/tests).

## File quan trọng

- Manifest: [manifest.json](/Users/minhphan46/Desktop/Projects/translate-extension/src/manifest.json)
- Background translate flow: [translator.ts](/Users/minhphan46/Desktop/Projects/translate-extension/src/background/translator.ts)
- OpenAI integration: [openai.ts](/Users/minhphan46/Desktop/Projects/translate-extension/src/background/openai.ts)
- Content script: [index.ts](/Users/minhphan46/Desktop/Projects/translate-extension/src/content/index.ts)
- Overlay popup: [overlay.ts](/Users/minhphan46/Desktop/Projects/translate-extension/src/content/overlay.ts)
- Dashboard/Settings UI: [App.tsx](/Users/minhphan46/Desktop/Projects/translate-extension/src/options/App.tsx)

## Ghi chú kỹ thuật

- `VI -> EN` cần OpenAI API key hợp lệ.
- `foreign -> VI` dùng Google Translate endpoint với source language auto-detect.
- Shortcut hiện tại dùng phím `Ctrl` đúng theo yêu cầu file `rq.md`.
- Popup dịch render gần vùng text được bôi đen.

## Lệnh hữu ích

```bash
npm test
npm run build
```
