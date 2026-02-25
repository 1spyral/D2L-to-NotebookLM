import React from "react";
import { createRoot } from "react-dom/client";
import browser from "webextension-polyfill";
import { ext } from "../lib/browser";
import {
  NOTEBOOKLM_LIST_NOTEBOOKS,
  NOTEBOOKLM_SAVE_TO_NOTEBOOK,
  type NotebookLmListNotebooksResponse,
  type NotebookLmSaveToNotebookResponse,
  type NotebookLmNotebook,
} from "../lib/notebooklm/messages";

function App() {
  const [actionStatus, setActionStatus] = React.useState("");
  const [isWorking, setIsWorking] = React.useState(false);
  const [notebookStatus, setNotebookStatus] = React.useState("Loading notebooks...");
  const [notebooks, setNotebooks] = React.useState<NotebookLmNotebook[]>([]);

  React.useEffect(() => {
    let cancelled = false;
    async function refreshNotebooks() {
      setNotebookStatus("Loading notebooks...");
      const cached = await browser.storage.local.get({ notebooks: [] });
      if (cancelled) return;
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

        if (cancelled) return;

        if (!response || response.ok === false) {
          const message = response?.error ?? "Failed to load notebooks.";
          setNotebookStatus(
            message === "NOT_SIGNED_IN" ? "Please sign in to NotebookLM." : message
          );
          return;
        }

        setNotebooks(response.notebooks);
        await browser.storage.local.set({ notebooks: response.notebooks });
        setNotebookStatus(response.notebooks.length === 0 ? "No notebooks found." : "");
      } catch (error) {
        if (cancelled) return;
        setNotebookStatus(String(error));
      }
    }

    void refreshNotebooks();
    return () => {
      cancelled = true;
    };
  }, []);

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
    setActionStatus("");
    setIsWorking(true);
    setActionStatus("Saving to NotebookLM...");

    try {
      const source = await getActiveTabSource();
      if (!source) {
        setActionStatus("No active tab URL found.");
        return;
      }

      const response = (await browser.runtime.sendMessage({
        type: NOTEBOOKLM_SAVE_TO_NOTEBOOK,
        sources: [source],
        notebookId: target.notebookId,
        notebookTitle:
          target.notebookId == null
            ? (target.notebookTitle ?? source.title ?? "Untitled notebook")
            : undefined,
      })) as NotebookLmSaveToNotebookResponse | undefined;

      if (!response || response.ok === false) {
        if (response?.error === "NOT_SIGNED_IN") {
          setNotebookStatus("Please sign in to NotebookLM.");
        }
        setActionStatus(response?.error ?? "Failed to add source.");
        return;
      }

      setActionStatus("Saved current tab to NotebookLM.");
    } catch (error) {
      setActionStatus(String(error));
    } finally {
      setIsWorking(false);
    }
  }

  return (
    <div style={{ fontFamily: "system-ui, sans-serif", padding: 12 }}>
      <h1 style={{ margin: 0, fontSize: 18 }}>D2L to NotebookLM</h1>
      <button
        style={{ marginTop: 12 }}
        onClick={() => void saveToNotebook({})}
        disabled={isWorking}
      >
        {isWorking ? "Working..." : "Create new notebook from current tab"}
      </button>
      {actionStatus && <p style={{ marginTop: 8 }}>{actionStatus}</p>}
      <div style={{ marginTop: 12 }}>
        <h2 style={{ margin: "8px 0", fontSize: 14 }}>Notebooks</h2>
        {notebookStatus && <p style={{ marginTop: 4 }}>{notebookStatus}</p>}
        {notebooks.length > 0 && (
          <ul style={{ paddingLeft: 16, margin: 0 }}>
            {notebooks.map((notebook) => (
              <li key={notebook.url} style={{ margin: "6px 0" }}>
                <button
                  type="button"
                  disabled={isWorking}
                  style={{
                    all: "unset",
                    cursor: "pointer",
                    color: "#2563eb",
                    textDecoration: "underline",
                  }}
                  onClick={() => void saveToNotebook({ notebookId: notebook.id })}
                  title={`Save current tab to ${notebook.title}`}
                >
                  {notebook.emoji ? `${notebook.emoji} ` : ""}
                  {notebook.title}
                </button>
                {typeof notebook.sourcesCount === "number" && (
                  <span style={{ marginLeft: 6, color: "#6b7280", fontSize: 12 }}>
                    ({notebook.sourcesCount})
                  </span>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

const root = document.getElementById("app");
if (root) {
  createRoot(root).render(<App />);
}
