import { NOTEBOOKLM_LIST_NOTEBOOKS, NOTEBOOKLM_SAVE_TO_NOTEBOOK } from "../lib/notebooklm/messages";
import { runtimeSendMessage, storageLocalGet, storageLocalSet } from "./runtime";
import type {
  NotebookLmListNotebooksResponse,
  NotebookLmNotebook,
  NotebookLmSaveToNotebookResponse,
  NotebookLmSource,
  NotebookPickerTarget,
} from "./types";

const AUTO_NOTEBOOK_ID_KEY = "d2l:autoNotebookId";
const AUTO_NOTEBOOK_TITLE = "D2L Imports";
const ACTION_BLUE = "#1A73E8";

async function resolveNotebookTarget(): Promise<NotebookPickerTarget> {
  const storage = await storageLocalGet({
    [AUTO_NOTEBOOK_ID_KEY]: "",
  });

  const cachedNotebookId =
    typeof storage[AUTO_NOTEBOOK_ID_KEY] === "string" ? storage[AUTO_NOTEBOOK_ID_KEY].trim() : "";
  if (cachedNotebookId) {
    return { notebookId: cachedNotebookId };
  }

  const listResponse = (await runtimeSendMessage<NotebookLmListNotebooksResponse>({
    type: NOTEBOOKLM_LIST_NOTEBOOKS,
  })) as NotebookLmListNotebooksResponse | undefined;

  if (listResponse?.ok && listResponse.notebooks.length > 0) {
    const firstNotebookId = listResponse.notebooks[0]?.id?.trim();
    if (firstNotebookId) {
      await storageLocalSet({ [AUTO_NOTEBOOK_ID_KEY]: firstNotebookId });
      return { notebookId: firstNotebookId };
    }
  }

  return { notebookTitle: AUTO_NOTEBOOK_TITLE };
}

export async function saveSourcesToNotebook(
  sources: NotebookLmSource[],
  fallbackNotebookTitle: string,
  explicitTarget?: NotebookPickerTarget,
  skipPoll?: boolean
): Promise<NotebookLmSaveToNotebookResponse> {
  const target = explicitTarget ?? (await resolveNotebookTarget());
  const response = (await runtimeSendMessage<NotebookLmSaveToNotebookResponse>({
    type: NOTEBOOKLM_SAVE_TO_NOTEBOOK,
    sources,
    notebookId: target.notebookId,
    notebookTitle: target.notebookId ? undefined : (target.notebookTitle ?? fallbackNotebookTitle),
    skipPoll,
  })) as NotebookLmSaveToNotebookResponse | undefined;

  if (!response) {
    return { ok: false, error: "No response from extension background." };
  }

  if (response.ok) {
    await storageLocalSet({ [AUTO_NOTEBOOK_ID_KEY]: response.notebookId });
  }

  return response;
}

async function fetchNotebookList(): Promise<NotebookLmListNotebooksResponse> {
  const response = await runtimeSendMessage<NotebookLmListNotebooksResponse>({
    type: NOTEBOOKLM_LIST_NOTEBOOKS,
  });

  if (!response) {
    return { ok: false, error: "No response from extension." };
  }

  return response as NotebookLmListNotebooksResponse;
}

export function closeNotebookPicker(): void {
  const pickers = Array.from(document.querySelectorAll("[data-d2l-notebooklm-picker]"));
  for (const picker of pickers) {
    const handler = (picker as HTMLElement & { _keyHandler?: (e: KeyboardEvent) => void })
      ._keyHandler;
    if (typeof handler === "function") {
      document.removeEventListener("keydown", handler);
    }
    picker.remove();
  }
}

export function showNotebookPicker(
  anchorButton: HTMLButtonElement,
  onSelect: (target: NotebookPickerTarget) => void
): void {
  closeNotebookPicker();

  const overlay = document.createElement("div");
  overlay.dataset.d2lNotebooklmPicker = "1";
  overlay.style.position = "fixed";
  overlay.style.inset = "0";
  overlay.style.zIndex = "99999";

  const popup = document.createElement("div");
  const popupWidth = 280;
  popup.style.position = "fixed";
  popup.style.width = `${popupWidth}px`;
  popup.style.background = "#fff";
  popup.style.border = "1px solid rgba(0,0,0,0.15)";
  popup.style.borderRadius = "8px";
  popup.style.boxShadow = "0 4px 16px rgba(0,0,0,0.15)";
  popup.style.zIndex = "100000";
  popup.style.fontFamily = "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
  popup.style.overflow = "hidden";
  popup.style.display = "flex";
  popup.style.flexDirection = "column";

  const rect = anchorButton.getBoundingClientRect();
  const maxHeight = 320;
  let top = rect.bottom + 4;
  if (top + maxHeight > window.innerHeight) {
    top = rect.top - maxHeight - 4;
    if (top < 0) top = 8;
  }
  let left = rect.left;
  if (left + popupWidth > window.innerWidth) {
    left = window.innerWidth - popupWidth - 8;
  }
  popup.style.top = `${top}px`;
  popup.style.left = `${left}px`;
  popup.style.maxHeight = `${maxHeight}px`;

  // Header
  const header = document.createElement("div");
  header.style.display = "flex";
  header.style.alignItems = "center";
  header.style.justifyContent = "space-between";
  header.style.padding = "10px 12px 6px";

  const headerLabel = document.createElement("span");
  headerLabel.textContent = "Add to notebook";
  headerLabel.style.fontSize = "13px";
  headerLabel.style.fontWeight = "600";
  headerLabel.style.color = "#333";

  const refreshBtn = document.createElement("button");
  refreshBtn.type = "button";
  refreshBtn.title = "Refresh notebooks";
  refreshBtn.style.border = "none";
  refreshBtn.style.background = "none";
  refreshBtn.style.cursor = "pointer";
  refreshBtn.style.fontSize = "16px";
  refreshBtn.style.color = "#666";
  refreshBtn.style.padding = "2px 4px";
  refreshBtn.style.borderRadius = "4px";
  refreshBtn.style.lineHeight = "1";
  refreshBtn.textContent = "\u21BB";
  refreshBtn.addEventListener("mouseenter", () => {
    refreshBtn.style.background = "#f0f0f0";
  });
  refreshBtn.addEventListener("mouseleave", () => {
    refreshBtn.style.background = "none";
  });

  header.append(headerLabel, refreshBtn);
  popup.append(header);

  // New notebook button
  const newNotebookBtn = document.createElement("button");
  newNotebookBtn.type = "button";
  newNotebookBtn.style.display = "flex";
  newNotebookBtn.style.alignItems = "center";
  newNotebookBtn.style.gap = "8px";
  newNotebookBtn.style.width = "100%";
  newNotebookBtn.style.padding = "8px 12px";
  newNotebookBtn.style.border = "none";
  newNotebookBtn.style.background = "none";
  newNotebookBtn.style.cursor = "pointer";
  newNotebookBtn.style.textAlign = "left";
  newNotebookBtn.style.fontSize = "13px";
  newNotebookBtn.style.fontWeight = "500";
  newNotebookBtn.style.color = ACTION_BLUE;
  newNotebookBtn.style.transition = "background 120ms";
  newNotebookBtn.addEventListener("mouseenter", () => {
    newNotebookBtn.style.background = "#f5f5f5";
  });
  newNotebookBtn.addEventListener("mouseleave", () => {
    newNotebookBtn.style.background = "none";
  });

  const plusIcon = document.createElement("span");
  plusIcon.textContent = "+";
  plusIcon.style.display = "flex";
  plusIcon.style.alignItems = "center";
  plusIcon.style.justifyContent = "center";
  plusIcon.style.width = "28px";
  plusIcon.style.height = "28px";
  plusIcon.style.borderRadius = "6px";
  plusIcon.style.background = "#e8f0fe";
  plusIcon.style.fontSize = "16px";
  plusIcon.style.fontWeight = "bold";
  plusIcon.style.color = ACTION_BLUE;

  const newLabel = document.createElement("span");
  newLabel.textContent = "New notebook";

  newNotebookBtn.append(plusIcon, newLabel);
  newNotebookBtn.addEventListener("click", () => {
    closeNotebookPicker();
    onSelect({});
  });
  popup.append(newNotebookBtn);

  // Divider
  const divider = document.createElement("div");
  divider.style.height = "1px";
  divider.style.background = "rgba(0,0,0,0.1)";
  popup.append(divider);

  // Content area
  const contentArea = document.createElement("div");
  contentArea.style.overflowY = "auto";
  contentArea.style.maxHeight = "220px";
  popup.append(contentArea);

  function showStatus(text: string): void {
    contentArea.innerHTML = "";
    const p = document.createElement("p");
    p.textContent = text;
    p.style.padding = "10px 12px";
    p.style.fontSize = "12px";
    p.style.color = "#888";
    p.style.margin = "0";
    contentArea.append(p);
  }

  function renderNotebooks(notebooks: NotebookLmNotebook[]): void {
    contentArea.innerHTML = "";
    if (notebooks.length === 0) {
      showStatus("No notebooks found.");
      return;
    }

    for (const notebook of notebooks) {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.title = notebook.title;
      btn.style.display = "flex";
      btn.style.alignItems = "center";
      btn.style.gap = "8px";
      btn.style.width = "100%";
      btn.style.padding = "8px 12px";
      btn.style.border = "none";
      btn.style.background = "none";
      btn.style.cursor = "pointer";
      btn.style.textAlign = "left";
      btn.style.fontSize = "13px";
      btn.style.color = "#333";
      btn.style.transition = "background 120ms";
      btn.addEventListener("mouseenter", () => {
        btn.style.background = "#f5f5f5";
      });
      btn.addEventListener("mouseleave", () => {
        btn.style.background = "none";
      });

      const emoji = document.createElement("span");
      emoji.textContent = notebook.emoji ?? "\uD83D\uDCD3";
      emoji.style.display = "flex";
      emoji.style.alignItems = "center";
      emoji.style.justifyContent = "center";
      emoji.style.width = "28px";
      emoji.style.height = "28px";
      emoji.style.borderRadius = "6px";
      emoji.style.background = "#f5f5f5";
      emoji.style.fontSize = "14px";

      const title = document.createElement("span");
      title.textContent = notebook.title;
      title.style.flex = "1";
      title.style.minWidth = "0";
      title.style.overflow = "hidden";
      title.style.textOverflow = "ellipsis";
      title.style.whiteSpace = "nowrap";
      title.style.fontWeight = "500";

      btn.append(emoji, title);

      if (typeof notebook.sourcesCount === "number") {
        const count = document.createElement("span");
        count.textContent = String(notebook.sourcesCount);
        count.style.fontSize = "11px";
        count.style.color = "#888";
        count.style.background = "#f0f0f0";
        count.style.padding = "1px 6px";
        count.style.borderRadius = "10px";
        btn.append(count);
      }

      btn.addEventListener("click", () => {
        closeNotebookPicker();
        onSelect({ notebookId: notebook.id });
      });

      contentArea.append(btn);
    }
  }

  async function loadNotebooks(): Promise<void> {
    showStatus("Loading notebooks...");
    refreshBtn.disabled = true;

    try {
      const response = await fetchNotebookList();

      if (!response.ok) {
        const message =
          response.error === "NOT_SIGNED_IN" ? "Please sign in to NotebookLM." : response.error;
        showStatus(message);
        return;
      }

      renderNotebooks(response.notebooks);
    } catch {
      showStatus("Failed to load notebooks.");
    } finally {
      refreshBtn.disabled = false;
    }
  }

  refreshBtn.addEventListener("click", () => {
    void loadNotebooks();
  });

  overlay.addEventListener("click", (event) => {
    if (event.target === overlay) {
      closeNotebookPicker();
    }
  });

  const handleKeyDown = (event: KeyboardEvent): void => {
    if (event.key === "Escape") {
      closeNotebookPicker();
    }
  };
  document.addEventListener("keydown", handleKeyDown);
  (overlay as HTMLElement & { _keyHandler?: (e: KeyboardEvent) => void })._keyHandler =
    handleKeyDown;

  overlay.append(popup);
  document.body.append(overlay);

  void loadNotebooks();
}
