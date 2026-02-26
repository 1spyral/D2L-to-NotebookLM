import { defineConfig } from "vite";
import { resolve } from "node:path";

const root = resolve(__dirname, "src");

export default defineConfig(() => {
  const outDir = process.env.OUT_DIR
    ? resolve(__dirname, process.env.OUT_DIR)
    : resolve(__dirname, "dist/dev");

  return {
    root,
    build: {
      outDir,
      emptyOutDir: false,
      lib: {
        entry: resolve(root, "content.ts"),
        name: "content",
        formats: ["iife"],
        fileName: () => "content.js",
      },
      rollupOptions: {
        output: {
          extend: true,
        },
      },
    },
  };
});
