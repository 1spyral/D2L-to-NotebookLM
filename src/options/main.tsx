import React from "react";
import { createRoot } from "react-dom/client";
import "webextension-polyfill";

function App() {
  const [value, setValue] = React.useState("");
  const [status, setStatus] = React.useState("");

  React.useEffect(() => {
    let cancelled = false;
    browser.storage.sync
      .get({ notebookUrl: "" })
      .then(({ notebookUrl }) => {
        if (cancelled) return;
        setValue(notebookUrl ?? "");
      })
      .catch((err) => {
        if (cancelled) return;
        setStatus(`Error: ${String(err)}`);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  async function save() {
    setStatus("");
    await browser.storage.sync.set({ notebookUrl: value.trim() });
    setStatus("Saved.");
  }

  return (
    <div style={{ fontFamily: "system-ui, sans-serif", padding: 12 }}>
      <h1 style={{ margin: 0, fontSize: 18 }}>Options</h1>
      <label style={{ display: "block", marginTop: 12 }}>
        NotebookLM URL
        <input
          style={{ display: "block", marginTop: 6, width: 360 }}
          value={value}
          onChange={(e) => setValue(e.currentTarget.value)}
          placeholder="https://..."
        />
      </label>
      <button style={{ marginTop: 12 }} onClick={() => void save()}>
        Save
      </button>
      {status && <p style={{ marginTop: 8 }}>{status}</p>}
    </div>
  );
}

const root = document.getElementById("app");
if (root) {
  createRoot(root).render(<App />);
}
