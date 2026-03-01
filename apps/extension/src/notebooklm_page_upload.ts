import {
  NOTEBOOKLM_PAGE_PING,
  NOTEBOOKLM_PAGE_PONG,
  NOTEBOOKLM_PAGE_UPLOAD,
  NOTEBOOKLM_PAGE_UPLOAD_RESULT,
  type NotebookLmUploadFileResponse,
} from "./lib/notebooklm/messages";

declare global {
  interface Window {
    __notebooklmPageUploadInjected?: boolean;
  }
}

type NotebookLmPageUploadPayload = {
  notebookId: string;
  sourceName: string;
  sourceId: string;
  authuser?: string;
  file?: {
    name?: string;
    size?: number;
    type?: string;
    base64?: string;
  };
};

type XhrPostResponse = {
  status: number;
  statusText: string;
  responseText: string;
};

(() => {
  if (window.__notebooklmPageUploadInjected) {
    return;
  }
  window.__notebooklmPageUploadInjected = true;

  try {
    window.postMessage({ type: NOTEBOOKLM_PAGE_PONG }, "*");
  } catch {
    // Ignore.
  }

  window.addEventListener("message", async (event: MessageEvent) => {
    if (event.source !== window) return;
    const data = event.data as
      | { type?: unknown }
      | {
          type: typeof NOTEBOOKLM_PAGE_UPLOAD;
          requestId: string;
          payload: NotebookLmPageUploadPayload;
        };
    if (data?.type === NOTEBOOKLM_PAGE_PING) {
      window.postMessage({ type: NOTEBOOKLM_PAGE_PONG }, "*");
      return;
    }
    if (!data || data.type !== NOTEBOOKLM_PAGE_UPLOAD) return;
    const uploadData = data as {
      type: typeof NOTEBOOKLM_PAGE_UPLOAD;
      requestId: string;
      payload: NotebookLmPageUploadPayload;
    };
    const { requestId, payload } = uploadData;
    console.log("[NotebookLM] Page upload request", {
      notebookId: payload?.notebookId,
      sourceName: payload?.sourceName,
      sourceId: payload?.sourceId,
      size: payload?.file?.size,
      type: payload?.file?.type,
    });
    const response = await handleUpload(payload);
    window.postMessage(
      {
        type: NOTEBOOKLM_PAGE_UPLOAD_RESULT,
        requestId,
        response,
      },
      "*"
    );
  });
})();

async function handleUpload(
  message: NotebookLmPageUploadPayload
): Promise<NotebookLmUploadFileResponse> {
  try {
    const authuser = message.authuser || "0";
    const baseUrl = window.location.origin;
    const startUrl = `${baseUrl}/upload/_/?authuser=${encodeURIComponent(authuser)}`;

    const base64 = message.file?.base64 || "";
    const data = base64 ? base64ToArrayBuffer(base64) : null;
    const hash = data ? await hashArrayBuffer(data) : null;
    console.log("[NotebookLM] Page upload hash", { hash });
    const isArrayBuffer = data instanceof ArrayBuffer;
    const contentLength =
      data && typeof data.byteLength === "number" && data.byteLength > 0
        ? data.byteLength
        : message.file?.size || 0;

    const body = JSON.stringify({
      PROJECT_ID: message.notebookId,
      SOURCE_NAME: message.sourceName,
      SOURCE_ID: message.sourceId,
    });

    const startHeaders: Record<string, string> = {
      "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8",
      "x-goog-upload-command": "start",
      "x-goog-upload-protocol": "resumable",
      "x-goog-upload-header-content-length": String(contentLength),
    };
    if (authuser) {
      startHeaders["x-goog-authuser"] = authuser;
    }

    console.log("[NotebookLM] Page upload start", {
      startUrl,
      contentLength,
      contentType: message.file?.type || "application/octet-stream",
      projectId: message.notebookId,
      sourceName: message.sourceName,
      sourceId: message.sourceId,
      body,
      dataType: typeof data,
      isArrayBuffer,
      dataLength: isArrayBuffer ? data.byteLength : undefined,
    });
    const startResponse = await fetch(startUrl, {
      method: "POST",
      headers: startHeaders,
      body: body.toString(),
      credentials: "include",
    });

    if (!startResponse.ok) {
      let responseBody = "";
      try {
        responseBody = await startResponse.text();
      } catch {}
      console.log("[NotebookLM] Page upload start failed", {
        status: startResponse.status,
        statusText: startResponse.statusText,
        body: responseBody.slice(0, 500),
      });
      return {
        ok: false,
        error:
          `Upload start failed: ${startResponse.status} ${startResponse.statusText} ${responseBody.slice(0, 200)}`.trim(),
      };
    }

    const uploadUrl =
      startResponse.headers.get("x-goog-upload-url") ||
      startResponse.headers.get("x-goog-upload-control-url");
    if (!uploadUrl) {
      return { ok: false, error: "Upload start missing upload URL." };
    }

    const uploadHeaders: Record<string, string> = {
      "x-goog-upload-command": "upload, finalize",
      "x-goog-upload-offset": "0",
      "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8",
    };
    if (authuser) {
      uploadHeaders["x-goog-authuser"] = authuser;
    }

    const uploadBody = data instanceof ArrayBuffer ? data : null;
    console.log("[NotebookLM] Page upload finalize", {
      uploadUrl,
      bodyLength: uploadBody?.byteLength,
      expectedLength: contentLength,
    });
    const uploadResponse = await xhrPost(uploadUrl, uploadHeaders, uploadBody);
    if (uploadResponse.status < 200 || uploadResponse.status >= 300) {
      console.log("[NotebookLM] Page upload finalize failed", {
        status: uploadResponse.status,
        statusText: uploadResponse.statusText,
        body: uploadResponse.responseText.slice(0, 500),
      });
      return {
        ok: false,
        error:
          `Upload failed: ${uploadResponse.status} ${uploadResponse.statusText} ${uploadResponse.responseText.slice(0, 200)}`.trim(),
      };
    }

    return { ok: true };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : String(error) };
  }
}

function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

async function hashArrayBuffer(buffer: ArrayBuffer): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", buffer);
  const bytes = Array.from(new Uint8Array(digest));
  return bytes
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("")
    .slice(0, 12);
}

function xhrPost(
  url: string,
  headers: Record<string, string>,
  body: ArrayBuffer | null
): Promise<XhrPostResponse> {
  return new Promise((resolve, reject) => {
    const request = new XMLHttpRequest();
    request.open("POST", url, true);
    request.withCredentials = true;
    for (const [key, value] of Object.entries(headers)) {
      request.setRequestHeader(key, value);
    }
    request.onload = () => {
      resolve({
        status: request.status,
        statusText: request.statusText,
        responseText: request.responseText,
      });
    };
    request.onerror = () => {
      reject(new Error("Upload failed: network error"));
    };
    request.send(body);
  });
}
