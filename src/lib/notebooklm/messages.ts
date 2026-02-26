export const NOTEBOOKLM_LIST_NOTEBOOKS = "NOTEBOOKLM_LIST_NOTEBOOKS" as const;
export const NOTEBOOKLM_SAVE_TO_NOTEBOOK = "NOTEBOOKLM_SAVE_TO_NOTEBOOK" as const;
export const NOTEBOOKLM_LIST_ACCOUNTS = "NOTEBOOKLM_LIST_ACCOUNTS" as const;
export const NOTEBOOKLM_UPLOAD_FILE = "NOTEBOOKLM_UPLOAD_FILE" as const;
export const NOTEBOOKLM_PING = "NOTEBOOKLM_PING" as const;
export const NOTEBOOKLM_CONTENT_READY = "NOTEBOOKLM_CONTENT_READY" as const;
export const NOTEBOOKLM_DEBUG_LOG = "NOTEBOOKLM_DEBUG_LOG" as const;

export type NotebookLmUrlSource = {
  url: string;
  title?: string;
};

export type NotebookLmFileBlob = {
  name: string;
  size: number;
  type?: string;
  data?: ArrayBuffer;
  base64?: string;
};

export type NotebookLmFileSource = {
  file: NotebookLmFileBlob;
  title?: string;
};

export type NotebookLmSource = NotebookLmUrlSource | NotebookLmFileSource;

export type NotebookLmListNotebooksRequest = {
  type: typeof NOTEBOOKLM_LIST_NOTEBOOKS;
};

export type NotebookLmSaveToNotebookRequest = {
  type: typeof NOTEBOOKLM_SAVE_TO_NOTEBOOK;
  sources: NotebookLmSource[];
  notebookId?: string;
  notebookTitle?: string;
};

export type NotebookLmSaveToNotebookResponse =
  | {
      ok: true;
      notebookId: string;
      notebookUrl: string;
      added: number;
    }
  | {
      ok: false;
      error: string;
    };

export type NotebookLmUploadFileRequest = {
  type: typeof NOTEBOOKLM_UPLOAD_FILE;
  notebookId: string;
  sourceName: string;
  sourceId: string;
  file: NotebookLmFileBlob;
  authuser?: string;
};

export type NotebookLmUploadFileResponse =
  | {
      ok: true;
    }
  | {
      ok: false;
      error: string;
    };

export type NotebookLmPingRequest = {
  type: typeof NOTEBOOKLM_PING;
};

export type NotebookLmPingResponse =
  | {
      ok: true;
    }
  | {
      ok: false;
      error: string;
    };

export type NotebookLmContentReadyMessage = {
  type: typeof NOTEBOOKLM_CONTENT_READY;
  url: string;
};

export type NotebookLmDebugLogMessage = {
  type: typeof NOTEBOOKLM_DEBUG_LOG;
  label: string;
  payload?: unknown;
};

export type NotebookLmNotebook = {
  id: string;
  title: string;
  url: string;
  emoji?: string;
  sourcesCount?: number;
};

export type NotebookLmListNotebooksResponse =
  | {
      ok: true;
      notebooks: NotebookLmNotebook[];
    }
  | {
      ok: false;
      error: string;
    };

export function isNotebookLmListNotebooksRequest(
  message: unknown
): message is NotebookLmListNotebooksRequest {
  if (!message || typeof message !== "object") {
    return false;
  }
  const candidate = message as { type?: unknown };
  return candidate.type === NOTEBOOKLM_LIST_NOTEBOOKS;
}

export type NotebookLmAccount = {
  name: string | null;
  email: string | null;
  src: string | null;
  isActive: boolean | null;
  isDefault: boolean | null;
  index: string | null;
  id: string | null;
};

export type NotebookLmListAccountsRequest = {
  type: typeof NOTEBOOKLM_LIST_ACCOUNTS;
};

export type NotebookLmListAccountsResponse =
  | {
      ok: true;
      accounts: NotebookLmAccount[];
    }
  | {
      ok: false;
      error: string;
    };

export function isNotebookLmSaveToNotebookRequest(
  message: unknown
): message is NotebookLmSaveToNotebookRequest {
  if (!message || typeof message !== "object") {
    return false;
  }
  const candidate = message as { type?: unknown; sources?: unknown };
  return candidate.type === NOTEBOOKLM_SAVE_TO_NOTEBOOK && Array.isArray(candidate.sources);
}

export function isNotebookLmListAccountsRequest(
  message: unknown
): message is NotebookLmListAccountsRequest {
  if (!message || typeof message !== "object") {
    return false;
  }
  const candidate = message as { type?: unknown };
  return candidate.type === NOTEBOOKLM_LIST_ACCOUNTS;
}
