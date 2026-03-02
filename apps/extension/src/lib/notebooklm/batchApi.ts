import type {
  NotebookLmAccount,
  NotebookLmFileBlob,
  NotebookLmFileSource,
  NotebookLmListAccountsResponse,
  NotebookLmListNotebooksResponse,
  NotebookLmNotebook,
  NotebookLmSaveToNotebookResponse,
  NotebookLmSource,
} from "./messages";
import { extensionLogger } from "../logger";

type Logger = {
  debug?: (...args: unknown[]) => void;
  info?: (...args: unknown[]) => void;
  warn?: (...args: unknown[]) => void;
  error?: (...args: unknown[]) => void;
};

export type NotebookLmBatchClientOptions = {
  fetch: typeof fetch;
  baseUrl?: string;
  accountIndex?: string;
  logger?: Logger;
  pollTimeoutMs?: number;
  pollIntervalMs?: number;
  random?: () => number;
  fileUploader?: (input: {
    notebookId: string;
    sourceName: string;
    sourceId: string;
    file: NotebookLmFileBlob;
    baseUrl: string;
    authuser?: string;
  }) => Promise<void>;
};

export type NotebookLmSaveToNotebookInput = {
  sources: NotebookLmSource[];
  notebookId?: string;
  notebookTitle?: string;
};

export type NotebookLmBatchClient = {
  listNotebooks: () => Promise<NotebookLmListNotebooksResponse>;
  saveToNotebook: (
    input: NotebookLmSaveToNotebookInput
  ) => Promise<NotebookLmSaveToNotebookResponse>;
  listAccounts: () => Promise<NotebookLmListAccountsResponse>;
};

const DEFAULT_BASE_URL = "https://notebooklm.google.com";
const BATCH_PATH = "/_/LabsTailwindUi/data/batchexecute";
const DEFAULT_POLL_TIMEOUT_MS = 60_000;
const DEFAULT_POLL_INTERVAL_MS = 1_000;

export function createNotebookLmBatchClient(
  options: NotebookLmBatchClientOptions
): NotebookLmBatchClient {
  const baseUrl = normalizeBaseUrl(options.baseUrl ?? DEFAULT_BASE_URL);
  const authuser = options.accountIndex?.trim() || undefined;
  const logger = options.logger ?? extensionLogger;
  const pollTimeoutMs = options.pollTimeoutMs ?? DEFAULT_POLL_TIMEOUT_MS;
  const pollIntervalMs = options.pollIntervalMs ?? DEFAULT_POLL_INTERVAL_MS;
  const random = options.random ?? Math.random;
  const fetcher = options.fetch;
  const fileUploader = options.fileUploader;

  async function listNotebooks(): Promise<NotebookLmListNotebooksResponse> {
    try {
      const tokens = await fetchTokens();
      if (!tokens.ok) {
        return { ok: false, error: tokens.error };
      }

      const responseText = await postBatchExecute({
        rpcId: "wXbhsf",
        bl: tokens.bl,
        at: tokens.at,
        sourcePath: "/",
        payload: JSON.stringify([null, 1, null, [2]]),
      });

      const notebooks = parseNotebookListResponse(responseText, baseUrl);
      return { ok: true, notebooks };
    } catch (error) {
      return { ok: false, error: stringifyError(error) };
    }
  }

  async function saveToNotebook(
    input: NotebookLmSaveToNotebookInput
  ): Promise<NotebookLmSaveToNotebookResponse> {
    const normalizedSources = normalizeSources(input.sources);
    if (normalizedSources.length === 0) {
      return { ok: false, error: "No valid sources provided." };
    }

    try {
      const tokens = await fetchTokens();
      if (!tokens.ok) {
        return { ok: false, error: tokens.error };
      }

      let notebookId = input.notebookId?.trim();
      if (!notebookId) {
        const title = input.notebookTitle?.trim();
        if (!title) {
          return { ok: false, error: "Notebook title is required to create a new notebook." };
        }
        notebookId = await createNotebook(tokens, title);
      }

      const tierLimit = await getNotebookTierLimit(tokens);
      const limitedSources =
        normalizedSources.length > tierLimit
          ? normalizedSources.slice(0, tierLimit)
          : normalizedSources;

      const urlSources = limitedSources.filter(isUrlSource);
      const fileSources = limitedSources.filter(isFileSource);

      if (fileSources.length > 0) {
        for (const source of fileSources) {
          await uploadFileSource(tokens, notebookId, source);
        }
      }

      if (urlSources.length > 0) {
        const urls = urlSources.map((source) => source.url);
        await addSources(tokens, notebookId, urls);
      }
      await pollNotebookReady(tokens, notebookId, pollTimeoutMs, pollIntervalMs);

      return {
        ok: true,
        notebookId,
        notebookUrl: notebookUrlForId(baseUrl, notebookId),
        added: limitedSources.length,
      };
    } catch (error) {
      logger.warn?.("NotebookLM save failed", error);
      return { ok: false, error: stringifyError(error) };
    }
  }

  async function listAccounts(): Promise<NotebookLmListAccountsResponse> {
    try {
      const response = await fetchWithContext(
        "https://accounts.google.com/ListAccounts?json=standard&source=ogb&md=1&cc=1&mn=1&mo=1&gpsia=1&fwput=860&listPages=1&origin=https%3A%2F%2Fwww.google.com",
        { credentials: "include" }
      );
      if (!response.ok) {
        return {
          ok: false,
          error: `Failed to fetch accounts: ${response.status} ${response.statusText}`,
        };
      }
      const body = await response.text();
      const accounts = parseAccountsListResponse(body);
      return { ok: true, accounts };
    } catch (error) {
      return { ok: false, error: stringifyError(error) };
    }
  }

  async function fetchTokens(): Promise<
    { ok: true; bl: string; at: string } | { ok: false; error: string }
  > {
    const url = authuser
      ? `${baseUrl}/?authuser=${encodeURIComponent(authuser)}&pageId=none`
      : `${baseUrl}/`;
    const response = await fetchWithContext(url, {
      credentials: "include",
      redirect: "error",
    });
    if (!response.ok) {
      return { ok: false, error: "NOT_SIGNED_IN" };
    }
    const html = await response.text();
    const tokens = parseTokensFromHtml(html);
    if (!tokens) {
      return { ok: false, error: "NOT_SIGNED_IN" };
    }
    return { ok: true, bl: tokens.bl, at: tokens.at };
  }

  async function createNotebook(
    tokens: { bl: string; at: string },
    title: string
  ): Promise<string> {
    const responseText = await postBatchExecute({
      rpcId: "CCqFvf",
      bl: tokens.bl,
      at: tokens.at,
      sourcePath: "/",
      payload: JSON.stringify([title]),
    });

    const notebookId = parseCreateNotebookResponse(responseText);
    if (!notebookId) {
      throw new Error("Failed to create notebook.");
    }
    return notebookId;
  }

  async function getNotebookTierLimit(tokens: { bl: string; at: string }): Promise<number> {
    const responseText = await postBatchExecute({
      rpcId: "ozz5Z",
      bl: tokens.bl,
      at: tokens.at,
      sourcePath: "/",
      payload: '[[[[null,"1",627],null,1]]]',
    });

    return parseNotebookTierLimitResponse(responseText);
  }

  async function addSources(
    tokens: { bl: string; at: string },
    notebookId: string,
    urls: string[]
  ): Promise<void> {
    const items = urls.map((url) => [null, null, [url]]);
    await postBatchExecute({
      rpcId: "izAoDd",
      bl: tokens.bl,
      at: tokens.at,
      sourcePath: `/notebook/${notebookId}`,
      payload: JSON.stringify([items, notebookId]),
    });
  }

  async function uploadFileSource(
    tokens: { bl: string; at: string },
    notebookId: string,
    source: NotebookLmFileSource
  ): Promise<void> {
    const file = source.file;
    const sourceName = (source.title ?? file.name).trim() || "Untitled file";

    // Register the source FIRST via batchexecute — the server assigns the sourceId.
    const sourceId = await createFileSource(tokens, notebookId, sourceName);

    if (fileUploader) {
      await fileUploader({
        notebookId,
        sourceName,
        sourceId,
        file,
        baseUrl,
        authuser,
      });
    } else {
      const uploadUrl = await startResumableUpload(notebookId, file, sourceId, sourceName);
      await uploadResumableFile(uploadUrl, file);
    }
  }

  async function startResumableUpload(
    notebookId: string,
    file: NotebookLmFileBlob,
    sourceId: string,
    sourceName: string
  ): Promise<string> {
    const authuserHeader = authuser ?? "0";
    const contentLength =
      typeof file.data?.byteLength === "number" && file.data.byteLength > 0
        ? file.data.byteLength
        : file.size;
    const url = `${baseUrl}/upload/_/?authuser=${encodeURIComponent(authuserHeader)}`;
    const body = new URLSearchParams({
      PROJECT_ID: notebookId,
      SOURCE_NAME: sourceName,
      SOURCE_ID: sourceId,
    });

    const response = await fetchWithContext(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8",
        "x-goog-upload-command": "start",
        "x-goog-upload-protocol": "resumable",
        "x-goog-upload-header-content-length": String(contentLength),
        "x-goog-upload-header-content-type": resolveFileContentType(file),
        "x-goog-authuser": authuserHeader,
      },
      body: body.toString(),
      credentials: "include",
    });

    if (!response.ok) {
      throw new Error(`NotebookLM upload start failed: ${response.status} ${response.statusText}`);
    }

    const uploadUrl =
      response.headers.get("x-goog-upload-url") ??
      response.headers.get("x-goog-upload-control-url");
    if (!uploadUrl) {
      throw new Error("NotebookLM upload start missing upload URL.");
    }
    return uploadUrl;
  }

  async function uploadResumableFile(uploadUrl: string, file: NotebookLmFileBlob): Promise<void> {
    const authuserHeader = authuser ?? "0";
    const response = await fetchWithContext(uploadUrl, {
      method: "POST",
      headers: new Headers({
        "x-goog-upload-command": "upload, finalize",
        "x-goog-upload-offset": "0",
        "x-goog-authuser": authuserHeader,
        "Content-Type": resolveFileContentType(file),
      }),
      body: file.data,
      credentials: "include",
    });

    if (!response.ok) {
      throw new Error(`NotebookLM upload failed: ${response.status} ${response.statusText}`);
    }
  }

  async function createFileSource(
    tokens: { bl: string; at: string },
    notebookId: string,
    fileName: string
  ): Promise<string> {
    const payload = JSON.stringify([
      [[fileName]],
      notebookId,
      [2],
      [1, null, null, null, null, null, null, null, null, null, [1]],
    ]);

    const responseText = await postBatchExecute({
      rpcId: "o4cbdc",
      bl: tokens.bl,
      at: tokens.at,
      sourcePath: `/notebook/${notebookId}`,
      payload,
    });

    const sourceId = parseCreateFileSourceResponse(responseText);
    if (!sourceId) {
      throw new Error("Failed to register file source: no source ID returned.");
    }
    return sourceId;
  }

  async function pollNotebookReady(
    tokens: { bl: string; at: string },
    notebookId: string,
    timeoutMs: number,
    intervalMs: number
  ): Promise<void> {
    const deadline = Date.now() + timeoutMs;
    let lastResponse = "";

    while (Date.now() < deadline) {
      lastResponse = await postBatchExecute({
        rpcId: "rLM1Ne",
        bl: tokens.bl,
        at: tokens.at,
        sourcePath: `/notebook/${notebookId}`,
        payload: JSON.stringify([notebookId, null, [2]]),
      });

      if (parseNotebookReadyResponse(lastResponse, notebookId)) {
        return;
      }

      await delay(intervalMs);
    }

    throw new Error("Timed out waiting for NotebookLM to finish adding sources.");
  }

  async function postBatchExecute(request: {
    rpcId: string;
    bl: string;
    at: string;
    sourcePath: string;
    payload: string;
  }): Promise<string> {
    const reqId = generateReqId(random);
    const url = buildBatchUrl(baseUrl, {
      rpcId: request.rpcId,
      bl: request.bl,
      sourcePath: request.sourcePath,
      reqId,
      authuser,
    });

    const body = buildBatchBody(request.rpcId, request.payload, request.at);
    const response = await fetchWithContext(url, {
      method: "POST",
      headers: new Headers({ "Content-Type": "application/x-www-form-urlencoded" }),
      body,
      credentials: "include",
    });
    if (!response.ok) {
      throw new Error(`NotebookLM request failed: ${response.status} ${response.statusText}`);
    }
    return response.text();
  }

  return {
    listNotebooks,
    saveToNotebook,
    listAccounts,
  };

  function fetchWithContext(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
    return fetcher.call(globalThis, input, init);
  }
}

export function parseTokensFromHtml(html: string): { bl: string; at: string } | null {
  const bl = extractToken(html, "cfb2h");
  const at = extractToken(html, "SNlM0e");
  if (!bl || !at) {
    return null;
  }
  return { bl, at };
}

export function parseNotebookListResponse(
  responseText: string,
  baseUrl: string
): NotebookLmNotebook[] {
  const line = findJsonLine(responseText);
  if (!line) {
    return [];
  }
  const outer = safeJsonParse(line);
  const innerPayload = Array.isArray(outer) ? outer[0]?.[2] : null;
  if (typeof innerPayload !== "string") {
    return [];
  }
  const inner = safeJsonParse(innerPayload);
  const list = Array.isArray(inner) ? inner[0] : null;
  if (!Array.isArray(list)) {
    return [];
  }

  const notebooks: NotebookLmNotebook[] = [];
  for (const entry of list) {
    if (!Array.isArray(entry) || entry.length < 3) continue;
    const hidden = Array.isArray(entry[5]) && entry[5].length > 0 && entry[5][0] === 3;
    if (hidden) continue;

    const id = typeof entry[2] === "string" ? entry[2] : null;
    if (!id) continue;

    const titleCandidate = typeof entry[0] === "string" ? entry[0].trim() : "";
    const title = titleCandidate || "Untitled notebook";
    const sourcesCount = Array.isArray(entry[1]) ? entry[1].length : undefined;
    const emoji = typeof entry[3] === "string" ? entry[3] : undefined;

    notebooks.push({
      id,
      title,
      url: notebookUrlForId(baseUrl, id),
      emoji,
      sourcesCount,
    });
  }

  return notebooks;
}

export function parseCreateNotebookResponse(responseText: string): string | null {
  const match = responseText.match(
    /\b[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}\b/
  );
  return match ? match[0] : null;
}

export function parseCreateFileSourceResponse(responseText: string): string | null {
  // The o4cbdc response contains the server-assigned source UUID.
  // Response format: wrb.fr payload has inner JSON like [[["<uuid>"],"filename",...]]
  // We extract the first UUID from the response text.
  const match = responseText.match(
    /\b[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}\b/
  );
  return match ? match[0] : null;
}

export function parseNotebookTierLimitResponse(responseText: string): number {
  return responseText.includes("notebooklm_plus_icon") ? 50 : 300;
}

export function parseNotebookReadyResponse(responseText: string, notebookId: string): boolean {
  return !responseText.includes(`null,\\"${notebookId}`);
}

export function parseAccountsListResponse(body: string): NotebookLmAccount[] {
  const match = body.match(/postMessage\('(.+?)',\s*'https:/s);
  if (!match?.[1]) {
    return [];
  }

  const decoded = match[1].replace(/\\x5b/g, "[").replace(/\\x5d/g, "]").replace(/\\x22/g, '"');

  try {
    const parsed = JSON.parse(decoded);
    const list = Array.isArray(parsed) && parsed.length > 1 ? parsed[1] : [];
    if (!Array.isArray(list)) {
      return [];
    }
    return list.map((entry) => ({
      name: entry?.[2] ?? null,
      email: entry?.[3] ?? null,
      src: entry?.[4] ?? null,
      isActive: entry?.[5] ?? null,
      isDefault: entry?.[6] ?? null,
      index: entry?.[7] ?? null,
      id: entry?.[10] ?? null,
    }));
  } catch {
    return [];
  }
}

export function buildBatchUrl(
  baseUrl: string,
  input: {
    rpcId: string;
    sourcePath: string;
    bl: string;
    reqId: string;
    authuser?: string;
  }
): string {
  const url = new URL(`${normalizeBaseUrl(baseUrl)}${BATCH_PATH}`);
  url.searchParams.set("rpcids", input.rpcId);
  url.searchParams.set("source-path", input.sourcePath);
  url.searchParams.set("bl", input.bl);
  url.searchParams.set("_reqid", input.reqId);
  url.searchParams.set("rt", "c");
  if (input.authuser) {
    url.searchParams.set("authuser", input.authuser);
  }
  return url.toString();
}

export function buildBatchBody(rpcId: string, payload: string, at: string): string {
  const fReq = JSON.stringify([[[rpcId, payload, null, "generic"]]]);
  const params = new URLSearchParams();
  params.set("f.req", fReq);
  params.set("at", at);
  return params.toString();
}

export function notebookUrlForId(baseUrl: string, id: string): string {
  return `${normalizeBaseUrl(baseUrl)}/notebook/${id}`;
}

function normalizeBaseUrl(baseUrl: string): string {
  return baseUrl.replace(/\/+$/, "");
}

function normalizeSources(sources: NotebookLmSource[]): NotebookLmSource[] {
  const normalized: NotebookLmSource[] = [];
  for (const source of sources) {
    if (isUrlSource(source)) {
      const trimmed = source.url.trim();
      if (trimmed.length === 0) continue;
      normalized.push({ ...source, url: trimmed });
      continue;
    }
    if (isFileSource(source)) {
      const hasData =
        (source.file?.data instanceof ArrayBuffer && source.file.data.byteLength > 0) ||
        (typeof source.file?.base64 === "string" && source.file.base64.length > 0);
      if (!hasData || source.file.size <= 0) continue;
      normalized.push(source);
    }
  }
  return normalized;
}

function isUrlSource(source: NotebookLmSource): source is { url: string; title?: string } {
  return typeof (source as { url?: unknown }).url === "string";
}

function isFileSource(source: NotebookLmSource): source is NotebookLmFileSource {
  return !!(source as NotebookLmFileSource).file;
}

function extractToken(html: string, key: string): string | null {
  const match = new RegExp(`"${key}":"([^"]+)"`).exec(html);
  return match ? match[1] : null;
}

function findJsonLine(responseText: string): string | null {
  const lines = responseText.split("\n").map((line) => line.trim());
  for (const line of lines) {
    if (!line.startsWith("[")) continue;
    return line;
  }
  return null;
}

function safeJsonParse(value: string): unknown {
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}

function generateReqId(random: () => number): string {
  const value = Math.floor(900000 * random() + 100000);
  return value.toString();
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => globalThis.setTimeout(resolve, ms));
}

function resolveFileContentType(file: NotebookLmFileBlob): string {
  if (file.type) return file.type;
  const extension = file.name.split(".").pop()?.toLowerCase();
  if (!extension) return "application/octet-stream";
  const map: Record<string, string> = {
    pdf: "application/pdf",
    txt: "text/plain",
    md: "text/markdown",
    csv: "text/csv",
    json: "application/json",
    html: "text/html",
    htm: "text/html",
    rtf: "application/rtf",
    doc: "application/msword",
    docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ppt: "application/vnd.ms-powerpoint",
    pptx: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    xls: "application/vnd.ms-excel",
    xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    png: "image/png",
    jpg: "image/jpeg",
    jpeg: "image/jpeg",
    gif: "image/gif",
    webp: "image/webp",
  };
  return map[extension] ?? "application/octet-stream";
}

function stringifyError(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === "string") {
    return error;
  }
  try {
    return JSON.stringify(error);
  } catch {
    return String(error);
  }
}
