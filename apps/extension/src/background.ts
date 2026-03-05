import browser from "./lib/browser";
import { createNotebookLmBatchClient } from "./lib/notebooklm/batchApi";
import { logDebug } from "./lib/logger";
import {
  isNotebookLmListAccountsRequest,
  isNotebookLmListNotebooksRequest,
  isNotebookLmSaveToNotebookRequest,
  NOTEBOOKLM_CONTENT_READY,
  NOTEBOOKLM_UPLOAD_FILE,
  NOTEBOOKLM_PING,
  NOTEBOOKLM_DEBUG_LOG,
  type NotebookLmFileBlob,
  type NotebookLmContentReadyMessage,
  type NotebookLmDebugLogMessage,
  type NotebookLmListAccountsResponse,
  type NotebookLmListNotebooksResponse,
  type NotebookLmSaveToNotebookRequest,
  type NotebookLmSaveToNotebookResponse,
  type NotebookLmPingResponse,
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

/** Cache of upload tabs keyed by notebookId so multiple file uploads reuse one tab. */
const uploadTabCache = new Map<string, number>();

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
  // Reuse an existing tab for this notebook, or create a new one.
  let tabId = uploadTabCache.get(input.notebookId);
  let tabValid = false;
  if (tabId != null) {
    try {
      const existing = await browser.tabs.get(tabId);
      tabValid = !!existing.url && existing.url.startsWith(input.baseUrl);
    } catch {
      tabValid = false;
    }
  }
  if (!tabValid || tabId == null) {
    const { tabId: newTabId } = await ensureNotebookLmTab(input.baseUrl, input.notebookId);
    tabId = newTabId;
    uploadTabCache.set(input.notebookId, tabId);
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
    // On failure, remove from cache so next attempt gets a fresh tab.
    uploadTabCache.delete(input.notebookId);
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
  logDebug("[NotebookLM] Opening background tab");
  const targetUrl = `${baseUrl}/notebook/${notebookId}`;
  const tab = await browser.tabs.create({ url: targetUrl, active: true });
  if (typeof tab.id !== "number") {
    throw new Error("Failed to open NotebookLM tab for upload.");
  }
  await waitForTabComplete(tab.id);
  await delay(300);
  const current = await browser.tabs.get(tab.id);
  if (!current.url || !current.url.startsWith(baseUrl)) {
    throw new Error("Please sign in to NotebookLM in the opened tab.");
  }
  logDebug("[NotebookLM] Background tab loaded", { tabId: tab.id, url: current.url });
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
