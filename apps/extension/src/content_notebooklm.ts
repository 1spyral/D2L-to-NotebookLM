import {
  NOTEBOOKLM_CONTENT_READY,
  NOTEBOOKLM_PAGE_PING,
  NOTEBOOKLM_PAGE_PONG,
  NOTEBOOKLM_PAGE_UPLOAD,
  NOTEBOOKLM_PAGE_UPLOAD_RESULT,
  NOTEBOOKLM_PING,
  NOTEBOOKLM_UPLOAD_FILE,
  type NotebookLmUploadFileRequest,
  type NotebookLmUploadFileResponse,
} from "./lib/notebooklm/messages";

type RuntimeApi = {
  onMessage: {
    addListener: (
      callback: (
        message: unknown,
        sender: unknown,
        sendResponse: (response: NotebookLmUploadFileResponse | { ok: true }) => void
      ) => boolean | undefined
    ) => void;
  };
  sendMessage: (message: unknown) => void;
};

type NotebookLmPageUploadResultMessage = {
  type: typeof NOTEBOOKLM_PAGE_UPLOAD_RESULT;
  requestId: string;
  response: NotebookLmUploadFileResponse;
};

(() => {
  const chromeRuntime = (globalThis as { chrome?: { runtime?: RuntimeApi } }).chrome?.runtime;
  const browserRuntime = (globalThis as { browser?: { runtime?: RuntimeApi } }).browser?.runtime;
  const runtime = (chromeRuntime || browserRuntime) as RuntimeApi | undefined;

  if (!runtime?.onMessage) {
    return;
  }

  try {
    runtime.sendMessage({ type: NOTEBOOKLM_CONTENT_READY, url: window.location.href });
  } catch {
    // Ignore failures to notify readiness.
  }

  runtime.onMessage.addListener((message, _sender, sendResponse) => {
    if (!message || typeof message !== "object") {
      return undefined;
    }

    if ((message as { type?: unknown }).type === NOTEBOOKLM_PING) {
      sendResponse({ ok: true });
      return undefined;
    }

    if ((message as { type?: unknown }).type !== NOTEBOOKLM_UPLOAD_FILE) {
      return undefined;
    }

    const uploadRequest = message as NotebookLmUploadFileRequest;
    console.log("[NotebookLM] Upload request", {
      notebookId: uploadRequest.notebookId,
      sourceName: uploadRequest.sourceName,
      sourceId: uploadRequest.sourceId,
      size: uploadRequest.file?.size,
      type: uploadRequest.file?.type,
    });

    handleUpload(uploadRequest)
      .then((response) => {
        console.log("[NotebookLM] Upload response", response);
        sendResponse(response);
      })
      .catch((error: unknown) => {
        console.log("[NotebookLM] Upload response error", error);
        sendResponse({ ok: false, error: String(error) });
      });
    return true;
  });
})();

async function handleUpload(
  message: NotebookLmUploadFileRequest
): Promise<NotebookLmUploadFileResponse> {
  await pingPageScript();
  const requestId = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  return new Promise((resolve) => {
    const handler = (event: MessageEvent) => {
      if (event.source !== window) return;
      const payload = event.data as NotebookLmPageUploadResultMessage;
      if (!payload || payload.type !== NOTEBOOKLM_PAGE_UPLOAD_RESULT) return;
      if (payload.requestId !== requestId) return;
      window.removeEventListener("message", handler);
      resolve(payload.response);
    };
    window.addEventListener("message", handler);
    const fileBase64 = message.file?.base64 || "";
    const fileData = message.file?.data;
    const fallbackBase64 = fileData ? arrayBufferToBase64(fileData) : "";
    const payloadBase64 = fileBase64 || fallbackBase64;
    console.log("[NotebookLM] Posting page upload", {
      hasBase64: Boolean(payloadBase64),
      base64Length: payloadBase64.length,
    });
    window.postMessage(
      {
        type: NOTEBOOKLM_PAGE_UPLOAD,
        requestId,
        payload: {
          notebookId: message.notebookId,
          sourceName: message.sourceName,
          sourceId: message.sourceId,
          file: {
            name: message.file?.name,
            size: message.file?.size,
            type: message.file?.type,
            base64: payloadBase64,
          },
          authuser: message.authuser,
        },
      },
      "*"
    );
    setTimeout(() => {
      console.log("[NotebookLM] Upload response timeout", { requestId });
    }, 10000);
  });
}

function pingPageScript(): Promise<void> {
  return new Promise((resolve) => {
    const timeout = setTimeout(() => {
      window.removeEventListener("message", handler);
      console.log("[NotebookLM] Page upload ping timeout");
      resolve();
    }, 2000);
    const handler = (event: MessageEvent) => {
      if (event.source !== window) return;
      const payload = event.data as { type?: unknown };
      if (!payload || payload.type !== NOTEBOOKLM_PAGE_PONG) return;
      clearTimeout(timeout);
      window.removeEventListener("message", handler);
      console.log("[NotebookLM] Page upload pong");
      resolve();
    };
    window.addEventListener("message", handler);
    window.postMessage({ type: NOTEBOOKLM_PAGE_PING }, "*");
  });
}

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  const chunkSize = 0x8000;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    binary += String.fromCharCode.apply(null, Array.from(bytes.subarray(i, i + chunkSize)));
  }
  return btoa(binary);
}
