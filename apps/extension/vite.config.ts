import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { resolve } from "node:path";

const root = resolve(__dirname, "src");
const appBundle = "app";
const contentBundles = new Set(["content_d2l", "content_notebooklm", "notebooklm_page_upload"]);

export default defineConfig(() => {
  const outDir = process.env.OUT_DIR
    ? resolve(__dirname, process.env.OUT_DIR)
    : resolve(__dirname, "dist/dev");
  const isDev = process.env.NODE_ENV !== "production";
  const bundle = process.env.EXT_BUNDLE ?? appBundle;
  const isAppBundle = bundle === appBundle;

  const appBuild = {
    outDir,
    emptyOutDir: !process.env.VITE_WATCH,
    rollupOptions: {
      input: {
        popup: resolve(root, "popup.html"),
        background: resolve(root, "background.ts"),
      },
      output: {
        entryFileNames: "[name].js",
        chunkFileNames: "chunks/[name]-[hash].js",
        assetFileNames: "assets/[name]-[hash][extname]",
      },
    },
  };

  const contentBuild = {
    outDir,
    emptyOutDir: false,
    rollupOptions: {
      input: resolve(root, `${bundle}.ts`),
      output: {
        format: "iife" as const,
        name: "D2LToNotebookLMContent",
        inlineDynamicImports: true,
        entryFileNames: `${bundle}.js`,
        chunkFileNames: "chunks/[name]-[hash].js",
        assetFileNames: "assets/[name]-[hash][extname]",
      },
    },
  };

  if (!isAppBundle && !contentBundles.has(bundle)) {
    throw new Error(`Unknown EXT_BUNDLE value: ${bundle}`);
  }

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
    build: isAppBundle ? appBuild : contentBuild,
  };
});
