import React from "react";
import { createRoot } from "react-dom/client";
import browser from "webextension-polyfill";
import { ext } from "../lib/browser";
import "./index.css";
import {
  NOTEBOOKLM_LIST_NOTEBOOKS,
  NOTEBOOKLM_SAVE_TO_NOTEBOOK,
  NOTEBOOKLM_DEBUG_LOG,
  type NotebookLmFileBlob,
  type NotebookLmListNotebooksResponse,
  type NotebookLmSaveToNotebookResponse,
  type NotebookLmNotebook,
} from "../lib/notebooklm/messages";
import { DarkModeToggle } from "./components/DarkModeToggle";
import { SaveUrlMenu } from "./components/SaveUrlMenu";

function App() {
  const [actionStatus, setActionStatus] = React.useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);
  const [isWorking, setIsWorking] = React.useState(false);
  const [notebookStatus, setNotebookStatus] = React.useState("Loading notebooks...");
  const [notebooks, setNotebooks] = React.useState<NotebookLmNotebook[]>([]);
  const [darkMode, setDarkMode] = React.useState(false);
  const [activeUrl, setActiveUrl] = React.useState<string | null>(null);
  const [pendingFiles, setPendingFiles] = React.useState<NotebookLmFileBlob[] | null>(null);
  const [mode, setMode] = React.useState<"url" | "files">("url");

  React.useEffect(() => {
    browser.tabs.query({ active: true, currentWindow: true }).then((tabs) => {
      const url = tabs[0]?.url?.trim();
      if (url) setActiveUrl(url);
    });
  }, []);

  React.useEffect(() => {
    const stored = localStorage.getItem("popup:darkMode");
    if (stored === "true") {
      setDarkMode(true);
    } else if (stored === "false") {
      setDarkMode(false);
    } else if (window.matchMedia?.("(prefers-color-scheme: dark)").matches) {
      setDarkMode(true);
    }
  }, []);

  React.useEffect(() => {
    localStorage.setItem("popup:darkMode", darkMode ? "true" : "false");
  }, [darkMode]);

  React.useEffect(() => {
    document.documentElement.classList.toggle("dark", darkMode);
  }, [darkMode]);

  const refreshNotebooks = React.useCallback(async (signal?: AbortSignal) => {
    setNotebookStatus("Loading notebooks...");
    const cached = await browser.storage.local.get({ notebooks: [] });
    if (signal?.aborted) return;
    const cachedNotebooks = Array.isArray(cached.notebooks)
      ? (cached.notebooks as NotebookLmNotebook[]).filter(
          (notebook) => typeof notebook?.id === "string"
        )
      : [];
    if (cachedNotebooks.length > 0) {
      setNotebooks(cachedNotebooks);
      setNotebookStatus("");
    } else {
      setNotebooks([]);
    }
    try {
      const response = (await browser.runtime.sendMessage({
        type: NOTEBOOKLM_LIST_NOTEBOOKS,
      })) as NotebookLmListNotebooksResponse | undefined;

      if (signal?.aborted) return;

      if (!response || response.ok === false) {
        const message = response?.error ?? "Failed to load notebooks.";
        setNotebookStatus(message === "NOT_SIGNED_IN" ? "Please sign in to NotebookLM." : message);
        return;
      }

      setNotebooks(response.notebooks);
      await browser.storage.local.set({ notebooks: response.notebooks });
      setNotebookStatus(response.notebooks.length === 0 ? "No notebooks found." : "");
    } catch (error) {
      if (signal?.aborted) return;
      setNotebookStatus(String(error));
    }
  }, []);

  React.useEffect(() => {
    const controller = new AbortController();
    void refreshNotebooks(controller.signal);
    return () => controller.abort();
  }, [refreshNotebooks]);

  async function getActiveTabSource() {
    const tabs = await browser.tabs.query({ active: true, currentWindow: true });
    const activeTab = tabs[0];
    const url = activeTab?.url?.trim();
    if (!url) {
      return null;
    }
    return { url, title: activeTab?.title ?? undefined };
  }

  async function saveToNotebook(target: { notebookId?: string; notebookTitle?: string }) {
    setActionStatus(null);
    setIsWorking(true);

    try {
      let sources: Array<{ url?: string; title?: string; file?: NotebookLmFileBlob }> = [];
      let defaultTitle = "Untitled notebook";

      if (mode === "files") {
        const fileSources = pendingFiles?.map((file) => ({ file }));
        if (!fileSources?.length) {
          setActionStatus({ type: "error", message: "No files selected." });
          return;
        }
        sources = fileSources;
        defaultTitle = fileSources[0]?.file?.name ?? defaultTitle;
      } else {
        const source = await getActiveTabSource();
        if (!source) {
          setActionStatus({ type: "error", message: "No active tab URL found." });
          return;
        }
        sources = [source];
        defaultTitle = source.title ?? defaultTitle;
      }

      const response = (await browser.runtime.sendMessage({
        type: NOTEBOOKLM_SAVE_TO_NOTEBOOK,
        sources,
        notebookId: target.notebookId,
        notebookTitle:
          target.notebookId == null ? (target.notebookTitle ?? defaultTitle) : undefined,
      })) as NotebookLmSaveToNotebookResponse | undefined;

      if (!response || response.ok === false) {
        if (response?.error === "NOT_SIGNED_IN") {
          setNotebookStatus("Please sign in to NotebookLM.");
        }
        setActionStatus({ type: "error", message: response?.error ?? "Failed to add source." });
        return;
      }

      setActionStatus({ type: "success", message: "Added to NotebookLM." });
      setPendingFiles(null);

      // Open the saved notebook as the active tab
      await browser.tabs.create({ url: response.notebookUrl, active: true });

      // Refresh the notebooks list so counts and new notebooks are up to date
      void refreshNotebooks();
    } catch (error) {
      setActionStatus({ type: "error", message: String(error) });
    } finally {
      setIsWorking(false);
    }
  }

  async function handleFilesPicked(files: FileList) {
    if (!files || files.length === 0) return;
    setActionStatus(null);

    try {
      const entries = Array.from(files);
      const blobs = await Promise.all(
        entries.map(async (file, index): Promise<NotebookLmFileBlob> => {
          const buffer = await file.arrayBuffer();
          const hash = await hashArrayBuffer(buffer);
          console.log("[NotebookLM] Popup file hash", { name: file.name, index, hash });
          void browser.runtime.sendMessage({
            type: NOTEBOOKLM_DEBUG_LOG,
            label: "Popup file hash",
            payload: { name: file.name, index, hash },
          });
          return {
            name: file.name,
            size: file.size,
            type: file.type || undefined,
            base64: arrayBufferToBase64(buffer),
          };
        })
      );
      setPendingFiles(blobs);
    } catch (error) {
      setActionStatus({ type: "error", message: String(error) });
    }
  }

  const pendingFilesLabel =
    pendingFiles?.length === 1
      ? pendingFiles[0].name
      : pendingFiles
        ? `${pendingFiles.length} files`
        : undefined;

  function arrayBufferToBase64(buffer: ArrayBuffer): string {
    const bytes = new Uint8Array(buffer);
    let binary = "";
    const chunkSize = 0x8000;
    for (let i = 0; i < bytes.length; i += chunkSize) {
      binary += String.fromCharCode.apply(null, bytes.subarray(i, i + chunkSize));
    }
    return btoa(binary);
  }

  async function hashArrayBuffer(buffer: ArrayBuffer): Promise<string> {
    const digest = await crypto.subtle.digest("SHA-256", buffer);
    const bytes = Array.from(new Uint8Array(digest));
    return bytes
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("")
      .slice(0, 12);
  }

  return (
    <div className="w-85 bg-container dark:bg-dk-container">
      {/* ── Header ───────────────────────────────────────────── */}
      <div className="flex items-center gap-3 bg-container-low px-4 py-3.5 dark:bg-dk-cont-low">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[11px] bg-primary text-[11px] font-semibold tracking-tight text-on-primary shadow-btn">
          D2L
        </div>
        <div className="min-w-0 flex-1">
          <h1 className="font-display text-title-lg text-ink dark:text-dk-ink">
            D2L to NotebookLM
          </h1>
          <p className="mt-0.5 text-body-sm text-muted dark:text-dk-muted"></p>
        </div>
        <DarkModeToggle darkMode={darkMode} onToggle={() => setDarkMode((v) => !v)} />
      </div>

      {/* ── Mode toggle ──────────────────────────────────── */}
      <div className="px-4 pt-3 pb-0">
        <div className="flex rounded-pill bg-container-low p-0.5 dark:bg-dk-cont-low">
          <button
            type="button"
            className={`flex-1 rounded-pill py-1.5 text-center text-label-md font-medium transition-colors ${
              mode === "url"
                ? "bg-container text-ink shadow-elev1 dark:bg-dk-container dark:text-dk-ink"
                : "text-muted hover:text-ink dark:text-dk-muted dark:hover:text-dk-ink"
            }`}
            onClick={() => setMode("url")}
          >
            Save URL
          </button>
          <button
            type="button"
            className={`flex-1 rounded-pill py-1.5 text-center text-label-md font-medium transition-colors ${
              mode === "files"
                ? "bg-container text-ink shadow-elev1 dark:bg-dk-container dark:text-dk-ink"
                : "text-muted hover:text-ink dark:text-dk-muted dark:hover:text-dk-ink"
            }`}
            onClick={() => setMode("files")}
          >
            Upload Files
          </button>
        </div>
      </div>

      {/* ── Main action area ──────────────────────────────────── */}
      <div className="px-4 pb-4 pt-3">
        <SaveUrlMenu
          mode={mode}
          isWorking={isWorking}
          actionStatus={actionStatus}
          notebookStatus={notebookStatus}
          notebooks={notebooks}
          activeUrl={activeUrl ?? undefined}
          hasPendingFiles={Boolean(pendingFiles?.length)}
          pendingFilesLabel={pendingFilesLabel}
          onSave={(target) => void saveToNotebook(target)}
          onRefresh={() => void refreshNotebooks()}
          onPickFiles={(files) => void handleFilesPicked(files)}
          onClearFiles={() => setPendingFiles(null)}
        />
      </div>

      {/* ── Footer ───────────────────────────────────────────── */}
      <div className="border-t border-outline/30 px-4 py-2.5 dark:border-dk-outline/30">
        <a
          href="https://github.com/1spyral/D2lToNotebookLM"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-1.5 text-label-sm text-muted transition-colors hover:text-ink dark:text-dk-muted dark:hover:text-dk-ink"
        >
          <svg className="h-3 w-3 shrink-0" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61-.546-1.385-1.335-1.755-1.335-1.755-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" />
          </svg>
          Visit us on GitHub
        </a>
      </div>
    </div>
  );
}

const root = document.getElementById("app");
if (root) {
  createRoot(root).render(<App />);
}
