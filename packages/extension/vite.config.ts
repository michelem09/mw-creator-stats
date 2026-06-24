import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { resolve } from "node:path";

// Plain Vite build for an MV3 extension: index.html is the full-page UI, and a tiny
// background service worker opens it in a tab. manifest.json + icons live in public/
// and are copied verbatim. Relative base so assets resolve under chrome-extension://.
export default defineConfig({
  base: "./",
  plugins: [react()],
  resolve: {
    alias: {
      "@mw/core": resolve(__dirname, "../core/src"),
      "@mw/ui": resolve(__dirname, "../ui/src"),
    },
  },
  build: {
    outDir: "dist",
    emptyOutDir: true,
    rollupOptions: {
      input: {
        index: resolve(__dirname, "index.html"),
        background: resolve(__dirname, "src/background.ts"),
      },
      output: {
        entryFileNames: (chunk) =>
          chunk.name === "background" ? "background.js" : "assets/[name]-[hash].js",
        chunkFileNames: "assets/[name]-[hash].js",
        assetFileNames: "assets/[name]-[hash][extname]",
      },
    },
  },
});
