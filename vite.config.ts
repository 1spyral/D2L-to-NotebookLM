import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { resolve } from "node:path";

const root = resolve(__dirname, "src");

export default defineConfig(() => {
  const outDir = process.env.OUT_DIR
    ? resolve(__dirname, process.env.OUT_DIR)
    : resolve(__dirname, "dist/dev");

  return {
    plugins: [react()],
    root,
    publicDir: resolve(__dirname, "public"),
    build: {
      outDir,
      emptyOutDir: process.env.VITE_WATCH ? false : true,
      rollupOptions: {
        input: {
          popup: resolve(root, "popup.html"),
          options: resolve(root, "options.html"),
          background: resolve(root, "background.ts"),
          content: resolve(root, "content.ts")
        },
        output: {
          entryFileNames: "[name].js",
          chunkFileNames: "chunks/[name]-[hash].js",
          assetFileNames: "assets/[name]-[hash][extname]"
        }
      }
    }
  };
});
