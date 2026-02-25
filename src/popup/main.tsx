import React from "react";
import { createRoot } from "react-dom/client";
import "webextension-polyfill";

function App() {
  const [status, setStatus] = React.useState("Loading...");

  React.useEffect(() => {
    let cancelled = false;
    browser.storage.sync
      .get({ notebookUrl: "" })
      .then(({ notebookUrl }) => {
        if (cancelled) return;
        setStatus(
          notebookUrl
            ? `Configured: ${notebookUrl}`
            : "Configure NotebookLM URL in options."
        );
      })
      .catch((err) => {
        if (cancelled) return;
        setStatus(`Error: ${String(err)}`);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div style={{ fontFamily: "system-ui, sans-serif", padding: 12 }}>
      <h1 style={{ margin: 0, fontSize: 18 }}>D2L to NotebookLM</h1>
      <p style={{ marginTop: 8 }}>{status}</p>
    </div>
  );
}

const root = document.getElementById("app");
if (root) {
  createRoot(root).render(<App />);
}
