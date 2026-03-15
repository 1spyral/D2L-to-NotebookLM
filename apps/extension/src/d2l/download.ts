import { isSupportedFile } from "../lib/notebooklm/utils";
import { queryAllDeep } from "./dom";
import type { D2LWindow, JSZipLike, NotebookLmFileBlob } from "./types";

let jsZipPromise: Promise<JSZipLike> | null = null;

export function parseActionReference(raw: string): { group: string; actionId: string } | null {
  const match = raw.match(/D2L\.O\((['"])([^'"]+)\1,\s*(\d+)\)/);
  if (!match) {
    return null;
  }

  return {
    group: match[2],
    actionId: match[3],
  };
}

export function decodeActionScript(script: string): string {
  return script.replace(/\\\//g, "/").replace(/\\u0026/g, "&");
}

export function extractUrlsFromActionScript(script: string): string[] {
  const decoded = decodeActionScript(script);
  const matches = Array.from(decoded.matchAll(/"Url":"([^"]+)"/g));
  const urls: string[] = [];

  for (const match of matches) {
    const value = match[1]?.trim();
    if (!value) continue;
    urls.push(value);
  }

  return Array.from(new Set(urls));
}

export function scoreDownloadUrl(url: string): number {
  let score = 0;

  if (url.includes("DirectFileTopicDownload")) score += 120;
  if (/\/downloads\/[A-Za-z]+\/\d+\/Download/.test(url)) score += 100;
  if (url.includes("/startdownload/Initiate")) score += 80;
  if (url.includes("/topics/files/download/")) score += 50;
  if (url.includes("CheckFileTopicInfo")) score -= 100;
  if (url.includes("{")) score -= 30;

  return score;
}

export function chooseBestDownloadUrl(urls: string[]): string | null {
  const candidates = urls
    .map((url) => ({ url, score: scoreDownloadUrl(url) }))
    .filter((entry) => !entry.url.includes("{"))
    .sort((a, b) => b.score - a.score);

  return candidates[0]?.url ?? null;
}

export function extractDownloadUrlFromButton(button: HTMLButtonElement): string | null {
  const onclickSources = [button.getAttribute("data-onclick"), button.getAttribute("onclick")]
    .filter((value): value is string => typeof value === "string")
    .map((value) => value.trim())
    .filter((value) => value.length > 0);

  for (const source of onclickSources) {
    const reference = parseActionReference(source);
    if (!reference) {
      continue;
    }

    const actionScript = (window as D2LWindow).D2L?.OR?.[reference.group]?.[reference.actionId];
    if (!actionScript) {
      continue;
    }

    const urls = extractUrlsFromActionScript(actionScript);
    const best = chooseBestDownloadUrl(urls);
    if (best) {
      return best;
    }
  }

  // Fallback: some D2L pages register click handlers via D2L.LP.Web.UI.Events
  // instead of data-onclick attributes. Search all OR groups for an action
  // script that references this button's ID and contains a download URL.
  const buttonId = button.id;
  if (buttonId) {
    const orGroups = (window as D2LWindow).D2L?.OR;
    if (orGroups) {
      for (const [, group] of Object.entries(orGroups)) {
        if (typeof group !== "object" || group === null) continue;
        for (const [, script] of Object.entries(group as Record<string, unknown>)) {
          if (typeof script !== "string") continue;
          if (!script.includes(buttonId)) continue;
          const urls = extractUrlsFromActionScript(script);
          const best = chooseBestDownloadUrl(urls);
          if (best) {
            return best;
          }
        }
      }
    }
  }

  const fileViewer = queryAllDeep("[data-location]").find((element) =>
    element.getAttribute("data-location")?.includes("/content/")
  );
  const fallback = fileViewer?.getAttribute("data-location")?.trim();
  return fallback || null;
}

/**
 * Clicks a D2L download button and intercepts the dialog URL that D2L opens
 * (typically an iframe at InitiateModuleDownload). Returns the captured URL
 * so it can be passed to fetchDownloadFile.
 *
 * D2L's dialog system may create iframes without a `src` attribute and
 * navigate them afterward (via property setter, form POST, or
 * location.replace). We therefore poll all iframes on the page and check
 * their contentWindow location, which works reliably for same-origin frames.
 */
export function captureDownloadUrlViaClick(
  button: HTMLButtonElement,
  maxWaitMs = 10000,
  intervalMs = 200
): Promise<string | null> {
  return new Promise<string | null>((resolve) => {
    let resolved = false;

    function finish(url: string | null) {
      if (resolved) return;
      resolved = true;
      clearInterval(poll);
      clearTimeout(timeout);
      resolve(url);
    }

    function scanIframes(): string | null {
      const iframes = document.querySelectorAll<HTMLIFrameElement>("iframe");
      for (const iframe of iframes) {
        // Check the src attribute first
        if (/Initiate\w+Download/i.test(iframe.src)) return iframe.src;
        // Check the actual window location (handles navigated-after-append)
        try {
          const href = iframe.contentWindow?.location?.href;
          if (href && /Initiate\w+Download/i.test(href)) return href;
        } catch {
          // Cross-origin – ignore
        }
      }
      return null;
    }

    const timeout = setTimeout(() => {
      finish(null);
    }, maxWaitMs);

    const poll = setInterval(() => {
      const url = scanIframes();
      if (url) {
        finish(url);
      }
    }, intervalMs);

    // Trigger D2L's own click handler
    button.click();
  });
}

export function toAbsoluteUrl(url: string): string {
  return new URL(url, window.location.origin).href;
}

export function parseFilenameFromContentDisposition(
  contentDisposition: string | null
): string | null {
  if (!contentDisposition) {
    return null;
  }

  const utf8Match = contentDisposition.match(/filename\*=UTF-8''([^;]+)/i);
  if (utf8Match?.[1]) {
    return decodeURIComponent(utf8Match[1].trim()).replace(/[\\/]+/g, "_");
  }

  const quotedMatch = contentDisposition.match(/filename="([^"]+)"/i);
  if (quotedMatch?.[1]) {
    return quotedMatch[1].trim().replace(/[\\/]+/g, "_");
  }

  const plainMatch = contentDisposition.match(/filename=([^;]+)/i);
  if (plainMatch?.[1]) {
    return plainMatch[1].trim().replace(/[\\/]+/g, "_");
  }

  return null;
}

export function parseFilenameFromUrl(url: string): string {
  try {
    const parsed = new URL(url, window.location.origin);
    const pathPart = parsed.pathname.split("/").pop()?.trim();
    if (pathPart) {
      return decodeURIComponent(pathPart).replace(/[\\/]+/g, "_");
    }
  } catch {
    // Ignore parsing errors and use fallback below.
  }

  return `d2l-download-${Date.now()}.bin`;
}

export function responseLooksLikeFile(response: Response): boolean {
  const contentDisposition = response.headers.get("content-disposition")?.toLowerCase() ?? "";
  if (contentDisposition.includes("attachment")) {
    return true;
  }

  const contentType = response.headers.get("content-type")?.toLowerCase() ?? "";
  if (!contentType) {
    return true;
  }

  if (contentType.includes("text/html") || contentType.includes("application/json")) {
    return false;
  }

  return true;
}

export function extractLikelyDownloadUrlFromText(body: string): string | null {
  const decoded = decodeActionScript(body).replace(/\\"/g, '"');
  const urlMatches = Array.from(decoded.matchAll(/"Url":"([^"]+)"/g)).map((match) => match[1]);

  if (urlMatches.length > 0) {
    const best = chooseBestDownloadUrl(urlMatches);
    if (best) return best;
  }

  const directMatch = decoded.match(
    /(\/d2l\/le\/content\/\d+\/downloads\/[A-Za-z]+\/\d+\/Download)/
  );
  if (directMatch?.[1]) {
    return directMatch[1];
  }

  return null;
}

export function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  const chunkSize = 0x8000;

  for (let i = 0; i < bytes.length; i += chunkSize) {
    binary += String.fromCharCode.apply(null, Array.from(bytes.subarray(i, i + chunkSize)));
  }

  return btoa(binary);
}

export function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

export function isZipFile(file: NotebookLmFileBlob): boolean {
  const fileType = file.type?.toLowerCase() ?? "";
  const fileName = file.name.toLowerCase();
  return fileType.includes("zip") || fileName.endsWith(".zip");
}

export function guessMimeType(fileName: string): string | undefined {
  const lower = fileName.toLowerCase();
  if (lower.endsWith(".pdf")) return "application/pdf";
  if (lower.endsWith(".txt")) return "text/plain";
  if (lower.endsWith(".md")) return "text/markdown";
  if (lower.endsWith(".docx"))
    return "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
  if (lower.endsWith(".doc")) return "application/msword";
  if (lower.endsWith(".pptx"))
    return "application/vnd.openxmlformats-officedocument.presentationml.presentation";
  if (lower.endsWith(".ppt")) return "application/vnd.ms-powerpoint";
  if (lower.endsWith(".xlsx"))
    return "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
  if (lower.endsWith(".csv")) return "text/csv";
  if (lower.endsWith(".html")) return "text/html";
  if (lower.endsWith(".htm")) return "text/html";
  return undefined;
}

function toSafeZipEntryName(entryName: string): string {
  const trimmed = entryName.replace(/^\/+/, "").replace(/^__MACOSX\//, "");
  return trimmed
    .replace(/[\\/:*?"<>|]+/g, "_")
    .replace(/\s+/g, " ")
    .trim();
}

async function getJsZip(): Promise<JSZipLike> {
  if (!jsZipPromise) {
    jsZipPromise = (async () => {
      const module = (await import(
        "../../../../node_modules/.pnpm/jszip@3.10.1/node_modules/jszip/dist/jszip.min.js"
      )) as {
        default?: unknown;
        JSZip?: unknown;
      };
      const candidate =
        (module.default as JSZipLike | undefined) ??
        (module.JSZip as JSZipLike | undefined) ??
        ((globalThis as { JSZip?: unknown }).JSZip as JSZipLike | undefined);

      if (!candidate || typeof candidate.loadAsync !== "function") {
        throw new Error("JSZip browser bundle failed to load.");
      }

      return candidate;
    })();
  }

  return jsZipPromise;
}

export async function unzipFile(file: NotebookLmFileBlob): Promise<NotebookLmFileBlob[]> {
  const sourceBuffer = file.data ?? (file.base64 ? base64ToArrayBuffer(file.base64) : undefined);
  if (!sourceBuffer) {
    throw new Error("ZIP file had no data to extract.");
  }

  const jsZip = await getJsZip();
  const archive = await jsZip.loadAsync(sourceBuffer);
  const extracted: NotebookLmFileBlob[] = [];
  const entries = Object.values(archive.files);

  for (const entry of entries) {
    if (entry.dir) {
      continue;
    }

    const entryName = toSafeZipEntryName(entry.name);
    if (!entryName || entryName.endsWith(".DS_Store") || !isSupportedFile(entryName)) {
      continue;
    }

    const entryBuffer = await entry.async("arraybuffer");
    if (entryBuffer.byteLength === 0) {
      continue;
    }

    extracted.push({
      name: entryName,
      size: entryBuffer.byteLength,
      type: guessMimeType(entryName),
      data: entryBuffer,
      base64: arrayBufferToBase64(entryBuffer),
    });
  }

  return extracted;
}

export async function responseToFileBlob(
  response: Response,
  fallbackUrl: string
): Promise<NotebookLmFileBlob | null> {
  if (!response.ok) {
    return null;
  }

  if (!responseLooksLikeFile(response)) {
    return null;
  }

  const blob = await response.blob();
  if (blob.size === 0) {
    return null;
  }

  const fileName =
    parseFilenameFromContentDisposition(response.headers.get("content-disposition")) ??
    parseFilenameFromUrl(fallbackUrl);
  const buffer = await blob.arrayBuffer();

  return {
    name: fileName,
    size: blob.size,
    type: blob.type || undefined,
    data: buffer,
    base64: arrayBufferToBase64(buffer),
  };
}

export function isAsyncDownloadUrl(url: string): boolean {
  return /Initiate\w+Download/i.test(url);
}

export function parseAsyncDownloadMeta(
  url: string
): { orgUnitId: string; downloadType: string } | null {
  const typeMatch = url.match(/Initiate(\w+?)Download/i);
  const orgMatch = url.match(/\/content\/(\d+)/);
  if (!typeMatch?.[1] || !orgMatch?.[1]) return null;
  return { orgUnitId: orgMatch[1], downloadType: typeMatch[1] };
}

export function parsePollResponse(body: string): { jobId: number; jobStatus: string } | null {
  const json = body.replace(/^while\(\d+\);/, "").trim();
  try {
    const parsed = JSON.parse(json) as {
      Payload?: { JobId?: number; JobStatus?: string };
    };
    const payload = parsed?.Payload;
    if (payload?.JobId != null && payload?.JobStatus) {
      return { jobId: payload.JobId, jobStatus: payload.JobStatus };
    }
  } catch {
    // Not valid JSON – fall through.
  }
  return null;
}

export function extractJobIdFromBody(body: string): string | null {
  // Try D2L's while(1);{json} format first (used by Poll responses)
  const pollResult = parsePollResponse(body);
  if (pollResult && pollResult.jobId > 0) return String(pollResult.jobId);

  // Decode escaped slashes so URL patterns match in JSON-encoded action scripts.
  // The InitiateModuleDownload response is an HTML page whose embedded action
  // scripts contain URLs like \/d2l\/le\/content\/{org}\/downloads\/Module\/{id}\/Poll
  const decoded = decodeActionScript(body);

  const pollUrlMatch = decoded.match(/\/downloads\/\w+\/(\d+)\/Poll/i);
  if (pollUrlMatch?.[1]) return pollUrlMatch[1];

  const downloadUrlMatch = decoded.match(/\/downloads\/\w+\/(\d+)\/Download/i);
  if (downloadUrlMatch?.[1]) return downloadUrlMatch[1];

  return null;
}

function buildAsyncDownloadUrl(orgUnitId: string, downloadType: string, jobId: string): string {
  return `/d2l/le/content/${orgUnitId}/downloads/${downloadType}/${jobId}/Download`;
}

function buildPollUrl(
  orgUnitId: string,
  downloadType: string,
  jobId: string,
  requestId: number
): string {
  return `/d2l/le/content/${orgUnitId}/downloads/${downloadType}/${jobId}/Poll?isXhr=true&requestId=${requestId}&X-D2L-Session=no-keep-alive`;
}

async function pollForDownload(
  orgUnitId: string,
  downloadType: string,
  jobId: string,
  maxWaitMs: number,
  intervalMs: number,
  onStatus?: (status: string) => void
): Promise<NotebookLmFileBlob | null> {
  const start = Date.now();
  let requestId = 1;

  while (Date.now() - start < maxWaitMs) {
    await new Promise<void>((resolve) => {
      globalThis.setTimeout(resolve, intervalMs);
    });

    const elapsed = Math.round((Date.now() - start) / 1000);
    onStatus?.(`Preparing… ${elapsed}s`);

    try {
      const pollUrl = toAbsoluteUrl(buildPollUrl(orgUnitId, downloadType, jobId, requestId));
      requestId += 1;
      const response = await fetch(pollUrl, {
        credentials: "include",
        redirect: "follow",
      });
      const body = await response.text();
      const poll = parsePollResponse(body);

      if (poll?.jobStatus === "Failed") {
        return null;
      }

      if (poll?.jobStatus === "Successful") {
        const downloadUrl = toAbsoluteUrl(buildAsyncDownloadUrl(orgUnitId, downloadType, jobId));
        const fileResponse = await fetch(downloadUrl, {
          credentials: "include",
          redirect: "follow",
        });
        return responseToFileBlob(fileResponse, downloadUrl);
      }
    } catch {
      // Poll request failed – retry on next iteration.
    }
  }

  return null;
}

export async function fetchDownloadFile(
  url: string,
  onStatus?: (status: string) => void
): Promise<NotebookLmFileBlob | null> {
  const absoluteUrl = toAbsoluteUrl(url);

  const firstResponse = await fetch(absoluteUrl, {
    credentials: "include",
    redirect: "follow",
  });

  const firstAttempt = await responseToFileBlob(firstResponse, absoluteUrl);
  if (firstAttempt) {
    return firstAttempt;
  }

  const firstBody = await firstResponse.text();

  // Handle async downloads (InitiateModuleDownload, InitiateCourseDownload, etc.)
  if (isAsyncDownloadUrl(url)) {
    const meta = parseAsyncDownloadMeta(url);
    if (meta) {
      const jobId = extractJobIdFromBody(firstBody);
      if (jobId) {
        onStatus?.("Preparing…");
        const file = await pollForDownload(
          meta.orgUnitId,
          meta.downloadType,
          jobId,
          120_000,
          2_000,
          onStatus
        );
        if (file) return file;
      }
    }
  }

  const nestedUrl = extractLikelyDownloadUrlFromText(firstBody);
  if (!nestedUrl) {
    return null;
  }

  const secondAbsoluteUrl = toAbsoluteUrl(nestedUrl);
  const secondResponse = await fetch(secondAbsoluteUrl, {
    credentials: "include",
    redirect: "follow",
  });

  return responseToFileBlob(secondResponse, secondAbsoluteUrl);
}
