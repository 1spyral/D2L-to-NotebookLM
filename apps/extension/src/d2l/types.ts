export type ZipEntryLike = {
  dir: boolean;
  name: string;
  async: (type: "arraybuffer") => Promise<ArrayBuffer>;
};

export type JSZipLike = {
  loadAsync: (input: ArrayBuffer) => Promise<{ files: Record<string, ZipEntryLike> }>;
};

export type D2LWindow = Window & {
  D2L?: {
    OR?: Record<string, Record<string, string>>;
  };
};

export type NotebookLmFileBlob = {
  name: string;
  size: number;
  type?: string;
  data?: ArrayBuffer;
  base64?: string;
};

export type NotebookLmSource =
  | { url: string; title?: string }
  | { file: NotebookLmFileBlob; title?: string };

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

export type RuntimeLike = {
  sendMessage: (message: unknown, callback?: (response: unknown) => void) => unknown;
  lastError?: { message?: string };
};

export type StorageAreaLike = {
  get: (keys?: unknown, callback?: (items: Record<string, unknown>) => void) => unknown;
  set: (items: Record<string, unknown>, callback?: () => void) => unknown;
};

export type NotebookPickerTarget = { notebookId?: string; notebookTitle?: string };
