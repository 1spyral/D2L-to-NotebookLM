import "webextension-polyfill";
import browser from "webextension-polyfill";
import { createNotebookLmBatchClient } from "./lib/notebooklm/batchApi";
import {
  isNotebookLmListAccountsRequest,
  isNotebookLmListNotebooksRequest,
  isNotebookLmSaveToNotebookRequest,
  type NotebookLmListAccountsResponse,
  type NotebookLmListNotebooksResponse,
  type NotebookLmSaveToNotebookRequest,
  type NotebookLmSaveToNotebookResponse,
} from "./lib/notebooklm/messages";

browser.runtime.onInstalled.addListener(() => {
  console.log("Extension installed");
});

browser.runtime.onMessage.addListener((message) => {
  if (isNotebookLmListNotebooksRequest(message)) {
    return handleListNotebooks().catch(
      (error): NotebookLmListNotebooksResponse => ({
        ok: false,
        error: String(error),
      })
    );
  }

  if (isNotebookLmSaveToNotebookRequest(message)) {
    return handleSaveToNotebook(message).catch(
      (error): NotebookLmSaveToNotebookResponse => ({
        ok: false,
        error: String(error),
      })
    );
  }

  if (isNotebookLmListAccountsRequest(message)) {
    return handleListAccounts().catch(
      (error): NotebookLmListAccountsResponse => ({
        ok: false,
        error: String(error),
      })
    );
  }

  return undefined;
});

const DEFAULT_NOTEBOOKLM_URL = "https://notebooklm.google.com";

async function resolveNotebookLmBaseUrl(): Promise<string> {
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
  });
}

async function handleListNotebooks(): Promise<NotebookLmListNotebooksResponse> {
  const client = await getBatchClient();
  return client.listNotebooks();
}

async function handleSaveToNotebook(
  message: NotebookLmSaveToNotebookRequest
): Promise<NotebookLmSaveToNotebookResponse> {
  const client = await getBatchClient();
  return client.saveToNotebook({
    sources: message.sources,
    notebookId: message.notebookId,
    notebookTitle: message.notebookTitle,
  });
}

async function handleListAccounts(): Promise<NotebookLmListAccountsResponse> {
  const client = await getBatchClient();
  return client.listAccounts();
}
