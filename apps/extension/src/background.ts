import browser from "./lib/browser";
import { logDebug } from "./lib/logger";
import { createNotebookLmBatchClient } from "./lib/notebooklm/batchApi";
import {
  isNotebookLmListAccountsRequest,
  isNotebookLmListNotebooksRequest,
  isNotebookLmSaveToNotebookRequest,
  NOTEBOOKLM_CONTENT_READY,
  NOTEBOOKLM_DEBUG_LOG,
  NOTEBOOKLM_PING,
  NOTEBOOKLM_UPLOAD_FILE,
  type NotebookLmContentReadyMessage,
  type NotebookLmDebugLogMessage,
  type NotebookLmFileBlob,
  type NotebookLmListAccountsResponse,
  type NotebookLmListNotebooksResponse,
  type NotebookLmPingResponse,
  type NotebookLmSaveToNotebookRequest,
  type NotebookLmSaveToNotebookResponse,
  type NotebookLmUploadFileResponse,
} from "./lib/notebooklm/messages";

browser.runtime.onInstalled.addListener(() => {
  logDebug("[NotebookLM] Extension installed");
});

function withErrorResponse<T extends { ok: boolean; error?: string }>(
  fn: () => Promise<T>,
  fallback: (err: string) => T
): Promise<T> {
  return fn().catch((e) => fallback(String(e)));
}

export function routeRuntimeMessage(message: unknown) {
  if ((message as NotebookLmDebugLogMessage)?.type === NOTEBOOKLM_DEBUG_LOG) {
    const debug = message as NotebookLmDebugLogMessage;
    logDebug(`[NotebookLM] ${debug.label}`, debug.payload ?? "");
    return undefined;
  }
  if ((message as NotebookLmContentReadyMessage)?.type === NOTEBOOKLM_CONTENT_READY) {
    logDebug("[NotebookLM] Content script loaded", {
      url: (message as NotebookLmContentReadyMessage).url,
    });
    return undefined;
  }
  if (isNotebookLmListNotebooksRequest(message)) {
    return withErrorResponse<NotebookLmListNotebooksResponse>(
      () => handleListNotebooks(),
      (error) => ({ ok: false, error })
    );
  }

  if (isNotebookLmSaveToNotebookRequest(message)) {
    return withErrorResponse<NotebookLmSaveToNotebookResponse>(
      () => handleSaveToNotebook(message),
      (error) => ({ ok: false, error })
    );
  }

  if (isNotebookLmListAccountsRequest(message)) {
    return withErrorResponse<NotebookLmListAccountsResponse>(
      () => handleListAccounts(),
      (error) => ({ ok: false, error })
    );
  }

  return undefined;
}

browser.runtime.onMessage.addListener(routeRuntimeMessage);

const DEFAULT_NOTEBOOKLM_URL = "https://notebooklm.google.com";

export async function resolveNotebookLmBaseUrl(): Promise<string> {
  const stored = await browser.storage.sync.get({ notebookUrl: "" });
  const candidate = typeof stored.notebookUrl === "string" ? stored.notebookUrl.trim() : "";
  if (!candidate) {
    return DEFAULT_NOTEBOOKLM_URL;
  }

  try {
    return new URL(candidate).origin;
  } catch {
    try {
      return new URL(`https://${candidate}`).origin;
    } catch {
      return DEFAULT_NOTEBOOKLM_URL;
    }
  }
}

async function getBatchClient() {
  const baseUrl = await resolveNotebookLmBaseUrl();
  return createNotebookLmBatchClient({
    fetch: globalThis.fetch,
    baseUrl,
    fileUploader: (input) =>
      uploadFileViaContentScript({
        baseUrl,
        authuser: input.authuser,
        notebookId: input.notebookId,
        sourceId: input.sourceId,
        sourceName: input.sourceName,
        file: input.file,
      }),
  });
}

async function handleListNotebooks(): Promise<NotebookLmListNotebooksResponse> {
  const client = await getBatchClient();
  return client.listNotebooks();
}

/** The single tab used for all NotebookLM uploads to prevent multiple tabs. */
let globalUploadTabPromise: Promise<number> | null = null;

async function handleSaveToNotebook(
  message: NotebookLmSaveToNotebookRequest
): Promise<NotebookLmSaveToNotebookResponse> {
  const client = await getBatchClient();
  const result = await client.saveToNotebook({
    sources: message.sources,
    notebookId: message.notebookId,
    notebookTitle: message.notebookTitle,
    skipPoll: message.skipPoll,
  });

  return result;
}

async function handleListAccounts(): Promise<NotebookLmListAccountsResponse> {
  const client = await getBatchClient();
  return client.listAccounts();
}

async function uploadFileViaContentScript(input: {
  baseUrl: string;
  authuser?: string;
  notebookId: string;
  sourceId: string;
  sourceName: string;
  file: NotebookLmFileBlob;
}): Promise<void> {
  logDebug("[NotebookLM] Upload start", {
    notebookId: input.notebookId,
    sourceName: input.sourceName,
    size: input.file.size,
  });
  logDebug("[NotebookLM] Upload file buffer", {
    dataType: typeof input.file.data,
    isArrayBuffer: input.file.data instanceof ArrayBuffer,
    dataLength: input.file.data instanceof ArrayBuffer ? input.file.data.byteLength : undefined,
    base64Length: input.file.base64?.length,
  });

  // Ensure we have exactly one tab for uploads.
  globalUploadTabPromise = (globalUploadTabPromise ?? Promise.resolve<number | null>(null)).then(
    async (existingTabId) => {
      let tabIdToUse: number | null = existingTabId;

      // Check if the tab still exists and is on the right site.
      if (tabIdToUse !== null) {
        try {
          const tab = await browser.tabs.get(tabIdToUse);
          if (!tab.url || !tab.url.startsWith(input.baseUrl)) {
            tabIdToUse = null;
          }
        } catch {
          tabIdToUse = null;
        }
      }

      // If no valid existing tab, create a new one.
      if (tabIdToUse === null) {
        const res = await ensureNotebookLmTab(input.baseUrl, input.notebookId);
        tabIdToUse = res.tabId;
      }

      return tabIdToUse;
    }
  );

  const tabId = await globalUploadTabPromise;

  // Ensure the tab is navigated to the correct notebook before uploading.
  const currentTab = await browser.tabs.get(tabId);
  const targetUrl = `${input.baseUrl}/notebook/${input.notebookId}`;
  if (!currentTab.url || !currentTab.url.startsWith(targetUrl)) {
    logDebug("[NotebookLM] Navigating existing tab to notebook", {
      tabId,
      notebookId: input.notebookId,
    });
    await browser.tabs.update(tabId, { url: targetUrl, active: true });
    await waitForTabComplete(tabId);
    await delay(300);
  }

  logDebug("[NotebookLM] Upload tab ready", { tabId });

  await waitForContentScript(tabId);
  logDebug("[NotebookLM] Content script ready", { tabId });
  const fileBase64 = input.file.base64 || arrayBufferToBase64(input.file.data);
  const response = (await browser.tabs.sendMessage(tabId, {
    type: NOTEBOOKLM_UPLOAD_FILE,
    notebookId: input.notebookId,
    sourceId: input.sourceId,
    sourceName: input.sourceName,
    file: {
      name: input.file.name,
      size: input.file.size,
      type: input.file.type,
      base64: fileBase64,
    },
    authuser: input.authuser,
  })) as NotebookLmUploadFileResponse | undefined;

  if (!response || response.ok === false) {
    // On failure, we don't necessarily kill the tab, but the next attempt might retry.
    throw new Error(response?.error ?? "Upload failed.");
  }
  logDebug("[NotebookLM] Upload finished", { tabId });
}

function arrayBufferToBase64(buffer?: ArrayBuffer): string {
  if (!buffer) return "";
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.length; i += 1) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

async function ensureNotebookLmTab(
  baseUrl: string,
  notebookId: string
): Promise<{ tabId: number; created: boolean }> {
  // Try to find ANY existing NotebookLM tab first.
  const tabs = await browser.tabs.query({ url: `${baseUrl}/*` });
  if (tabs.length > 0 && tabs[0].id != null) {
    const tabId = tabs[0].id;
    logDebug("[NotebookLM] Reusing existing browser tab", { tabId });
    await browser.tabs.update(tabId, { active: true });
    return { tabId, created: false };
  }

  logDebug("[NotebookLM] Opening new background tab");
  const targetUrl = `${baseUrl}/notebook/${notebookId}`;
  const tab = await browser.tabs.create({ url: targetUrl, active: true });
  if (typeof tab.id !== "number") {
    throw new Error("Failed to open NotebookLM tab for upload.");
  }
  await waitForTabComplete(tab.id);
  await delay(300);

  // Validate that the tab has not been redirected away from the expected base URL
  const updatedTab = await browser.tabs.get(tab.id);
  if (!updatedTab.url || !updatedTab.url.startsWith(baseUrl)) {
    logDebug("[NotebookLM] Tab URL no longer matches base URL after open", {
      tabId: tab.id,
      url: updatedTab.url,
    });
    throw new Error("NotebookLM is not available; please make sure you are signed in.");
  }

  return { tabId: tab.id, created: true };
}

async function waitForContentScript(tabId: number): Promise<void> {
  logDebug("[NotebookLM] Waiting for content script", { tabId });
  const maxAttempts = 5;
  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    try {
      const tab = await browser.tabs.get(tabId);
      if (!tab.url || !tab.url.startsWith("https://notebooklm.google.com")) {
        throw new Error("NotebookLM tab is not available for uploads.");
      }
      await ensurePageUploader(tabId);
      const response = (await browser.tabs.sendMessage(tabId, {
        type: NOTEBOOKLM_PING,
      })) as NotebookLmPingResponse | undefined;
      if (response?.ok) {
        logDebug("[NotebookLM] Content script ping ok", { tabId });
        return;
      }
    } catch {
      await tryInjectContentScript(tabId);
    }
    await delay(300);
  }
  throw new Error("Content script not available in NotebookLM tab.");
}

async function tryInjectContentScript(tabId: number): Promise<void> {
  const scripting = (
    browser as typeof browser & {
      scripting?: {
        executeScript: (input: { target: { tabId: number }; files: string[] }) => Promise<void>;
      };
    }
  ).scripting;
  if (!scripting) {
    return;
  }
  try {
    await scripting.executeScript({
      target: { tabId },
      files: ["content_notebooklm.js"],
    });
  } catch {
    // Ignore injection failures; we'll retry.
  }
}

async function ensurePageUploader(tabId: number): Promise<void> {
  const scripting = (
    browser as typeof browser & {
      scripting?: {
        executeScript: (input: {
          target: { tabId: number };
          files: string[];
          world?: "MAIN" | "ISOLATED";
        }) => Promise<void>;
      };
    }
  ).scripting;
  if (!scripting) {
    logDebug("[NotebookLM] scripting API unavailable");
    return;
  }
  try {
    await scripting.executeScript({
      target: { tabId, allFrames: true },
      files: ["notebooklm_page_upload.js"],
      world: "MAIN",
    });
    logDebug("[NotebookLM] Page upload script injected", { tabId });
  } catch (error) {
    logDebug("[NotebookLM] Page upload script injection failed", {
      tabId,
      error: error instanceof Error ? error.message : String(error),
    });
  }
}

function waitForTabComplete(tabId: number): Promise<void> {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      browser.tabs.onUpdated.removeListener(listener);
      reject(new Error("Timed out waiting for NotebookLM tab to load."));
    }, 15_000);

    const listener = (updatedTabId: number, info: browser.Tabs.OnUpdatedChangeInfoType) => {
      if (updatedTabId !== tabId) return;
      if (info.status === "complete") {
        clearTimeout(timeout);
        browser.tabs.onUpdated.removeListener(listener);
        resolve();
      }
    };

    browser.tabs.onUpdated.addListener(listener);
  });
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => globalThis.setTimeout(resolve, ms));
}
