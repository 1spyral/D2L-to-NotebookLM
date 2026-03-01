import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { resolve } from "node:path";

const root = resolve(__dirname, "src");

export default defineConfig(() => {
  const outDir = process.env.OUT_DIR
    ? resolve(__dirname, process.env.OUT_DIR)
    : resolve(__dirname, "dist/dev");
  const isDev = process.env.NODE_ENV !== "production";

  return {
    plugins: [react()],
    define: {
      __DEV__: JSON.stringify(isDev),
    },
    root,
    publicDir: resolve(__dirname, "public"),
    test: {
      include: ["../tests/**/*.{test,spec}.?(c|m)[jt]s?(x)"],
      environment: "jsdom",
    },
    build: {
      outDir,
      emptyOutDir: !process.env.VITE_WATCH,
      rollupOptions: {
        input: {
          popup: resolve(root, "popup.html"),
          background: resolve(root, "background.ts"),
          content_notebooklm: resolve(root, "content_notebooklm.ts"),
          notebooklm_page_upload: resolve(root, "notebooklm_page_upload.ts"),
        },
        output: {
          entryFileNames: "[name].js",
          chunkFileNames: "chunks/[name]-[hash].js",
          assetFileNames: "assets/[name]-[hash][extname]",
        },
      },
    },
  };
});
