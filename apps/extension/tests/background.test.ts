import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  NOTEBOOKLM_DEBUG_LOG,
  NOTEBOOKLM_LIST_ACCOUNTS,
  NOTEBOOKLM_LIST_NOTEBOOKS,
  NOTEBOOKLM_SAVE_TO_NOTEBOOK,
} from "../src/lib/notebooklm/messages";

const { browserMock, logDebugMock, createNotebookLmBatchClientMock } = vi.hoisted(() => {
  const logDebug = vi.fn();
  const createClient = vi.fn();
  const browser = {
    runtime: {
      onInstalled: { addListener: vi.fn() },
      onMessage: { addListener: vi.fn() },
    },
    storage: {
      sync: { get: vi.fn() },
    },
  };
  return {
    browserMock: browser,
    logDebugMock: logDebug,
    createNotebookLmBatchClientMock: createClient,
  };
});

vi.mock("../src/lib/browser", () => ({ default: browserMock }));
vi.mock("../src/lib/logger", () => ({ logDebug: logDebugMock }));
vi.mock("../src/lib/notebooklm/batchApi", () => ({
  createNotebookLmBatchClient: createNotebookLmBatchClientMock,
}));

describe("background runtime message routing", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    browserMock.storage.sync.get.mockResolvedValue({ notebookUrl: "" });
  });

  it("registers a runtime message listener and routes list notebooks requests", async () => {
    const listNotebooks = vi.fn().mockResolvedValue({
      ok: true,
      notebooks: [
        { id: "nb-1", title: "Notebook", url: "https://notebooklm.google.com/notebook/nb-1" },
      ],
    });
    createNotebookLmBatchClientMock.mockReturnValue({
      listNotebooks,
      saveToNotebook: vi.fn(),
      listAccounts: vi.fn(),
    });

    await import("../src/background");
    const handler = browserMock.runtime.onMessage.addListener.mock.calls[0]?.[0];

    expect(typeof handler).toBe("function");
    const result = await handler({ type: NOTEBOOKLM_LIST_NOTEBOOKS });

    expect(createNotebookLmBatchClientMock).toHaveBeenCalledTimes(1);
    expect(listNotebooks).toHaveBeenCalledTimes(1);
    expect(result).toEqual({
      ok: true,
      notebooks: [
        { id: "nb-1", title: "Notebook", url: "https://notebooklm.google.com/notebook/nb-1" },
      ],
    });
  });

  it("routes save requests and returns fallback errors", async () => {
    const saveToNotebook = vi.fn().mockRejectedValue(new Error("save failed"));
    createNotebookLmBatchClientMock.mockReturnValue({
      listNotebooks: vi.fn(),
      saveToNotebook,
      listAccounts: vi.fn(),
    });

    const { routeRuntimeMessage } = await import("../src/background");
    const result = await routeRuntimeMessage({
      type: NOTEBOOKLM_SAVE_TO_NOTEBOOK,
      sources: [{ url: "https://example.com" }],
      notebookTitle: "Test",
    });

    expect(saveToNotebook).toHaveBeenCalledTimes(1);
    expect(result).toEqual({ ok: false, error: "Error: save failed" });
  });

  it("routes list accounts requests", async () => {
    const listAccounts = vi.fn().mockResolvedValue({
      ok: true,
      accounts: [],
    });
    createNotebookLmBatchClientMock.mockReturnValue({
      listNotebooks: vi.fn(),
      saveToNotebook: vi.fn(),
      listAccounts,
    });

    const { routeRuntimeMessage } = await import("../src/background");
    const result = await routeRuntimeMessage({ type: NOTEBOOKLM_LIST_ACCOUNTS });

    expect(listAccounts).toHaveBeenCalledTimes(1);
    expect(result).toEqual({ ok: true, accounts: [] });
  });

  it("handles debug log and unknown messages without routing", async () => {
    const { routeRuntimeMessage } = await import("../src/background");
    const debugResult = await routeRuntimeMessage({
      type: NOTEBOOKLM_DEBUG_LOG,
      label: "test",
      payload: { ok: true },
    });
    const unknownResult = await routeRuntimeMessage({ type: "UNKNOWN" });

    expect(debugResult).toBeUndefined();
    expect(unknownResult).toBeUndefined();
    expect(createNotebookLmBatchClientMock).not.toHaveBeenCalled();
    expect(logDebugMock).toHaveBeenCalledWith("[NotebookLM] test", { ok: true });
  });
});

describe("resolveNotebookLmBaseUrl", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns default when value is empty, invalid, or not a string", async () => {
    const { resolveNotebookLmBaseUrl } = await import("../src/background");

    browserMock.storage.sync.get.mockResolvedValueOnce({ notebookUrl: "" });
    await expect(resolveNotebookLmBaseUrl()).resolves.toBe("https://notebooklm.google.com");

    browserMock.storage.sync.get.mockResolvedValueOnce({ notebookUrl: 123 });
    await expect(resolveNotebookLmBaseUrl()).resolves.toBe("https://notebooklm.google.com");

    browserMock.storage.sync.get.mockResolvedValueOnce({ notebookUrl: "::::" });
    await expect(resolveNotebookLmBaseUrl()).resolves.toBe("https://notebooklm.google.com");
  });

  it("normalizes full URLs and bare hosts to origin", async () => {
    const { resolveNotebookLmBaseUrl } = await import("../src/background");

    browserMock.storage.sync.get.mockResolvedValueOnce({
      notebookUrl: " https://notebooklm.google.com/notebook/abc?x=1 ",
    });
    await expect(resolveNotebookLmBaseUrl()).resolves.toBe("https://notebooklm.google.com");

    browserMock.storage.sync.get.mockResolvedValueOnce({
      notebookUrl: "notebooklm.google.com",
    });
    await expect(resolveNotebookLmBaseUrl()).resolves.toBe("https://notebooklm.google.com");
  });
});
