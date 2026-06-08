import { resolve } from "node:path";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import { viteStaticCopy } from "vite-plugin-static-copy";

const target = process.env.VITE_BUILD_TARGET || "options";
const isContent = target === "content";
const isBackground = target === "background";
const isOptions = target === "options";

export default defineConfig({
  plugins: [
    react(),
    isOptions && viteStaticCopy({
      targets: [
        { src: "src/manifest.json", dest: "." },
        { src: "src/assets/icon-*.png", dest: "assets" }
      ]
    })
  ].filter(Boolean),
  build: {
    outDir: "dist",
    emptyOutDir: isOptions,
    rollupOptions: {
      input: isContent 
        ? { content: resolve(__dirname, "src/content/index.ts") }
        : isBackground
          ? { background: resolve(__dirname, "src/background/index.ts") }
          : { options: resolve(__dirname, "src/options/index.html") },
      output: {
        entryFileNames: (chunkInfo) => {
          if (chunkInfo.name === "background" || chunkInfo.name === "content") {
            return "[name].js";
          }
          return "assets/[name]-[hash].js";
        },
        format: (isContent || isBackground) ? "iife" : "es",
        chunkFileNames: "assets/[name]-[hash].js",
        assetFileNames: "assets/[name]-[hash][extname]"
      }
    }
  },
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: "./tests/setup.ts"
  }
});
