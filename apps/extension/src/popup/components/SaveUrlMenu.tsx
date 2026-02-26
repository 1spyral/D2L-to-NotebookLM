import React from "react";
import type { NotebookLmNotebook } from "../../lib/notebooklm/messages";

interface SaveUrlMenuProps {
  mode: "url" | "files";
  isWorking: boolean;
  actionStatus: { type: "success" | "error"; message: string } | null;
  notebookStatus: string;
  notebooks: NotebookLmNotebook[];
  activeUrl?: string;
  pendingFilesLabel?: string;
  hasPendingFiles: boolean;
  onSave: (target: { notebookId?: string; notebookTitle?: string }) => void;
  onRefresh: () => void;
  onPickFiles: (files: FileList) => void;
  onClearFiles: () => void;
}

function truncateUrl(url: string, maxLen = 35): string {
  try {
    const parsed = new URL(url);
    const display = parsed.hostname + parsed.pathname.replace(/\/$/, "") + parsed.search;
    return display.length > maxLen ? `${display.slice(0, maxLen)}…` : display;
  } catch {
    return url.length > maxLen ? `${url.slice(0, maxLen)}…` : url;
  }
}

export function SaveUrlMenu({
  mode,
  isWorking,
  actionStatus,
  notebookStatus,
  notebooks,
  activeUrl,
  pendingFilesLabel,
  hasPendingFiles,
  onSave,
  onRefresh,
  onPickFiles,
  onClearFiles,
}: SaveUrlMenuProps) {
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  return (
    <div>
      {/* Status toast */}
      {actionStatus && (
        <div
          className={`mb-2.5 flex items-center gap-1.5 rounded-item px-3 py-2 text-body-sm font-medium ${
            actionStatus.type === "success"
              ? "bg-success-cont text-success dark:bg-dk-success-cont dark:text-dk-success"
              : "bg-error-cont text-error dark:bg-dk-error-cont dark:text-dk-error"
          }`}
        >
          {actionStatus.type === "success" ? (
            <svg className="h-3 w-3 shrink-0" viewBox="0 0 20 20" fill="currentColor">
              <title>Success icon</title>
              <path
                fillRule="evenodd"
                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                clipRule="evenodd"
              />
            </svg>
          ) : (
            <svg className="h-3 w-3 shrink-0" viewBox="0 0 20 20" fill="currentColor">
              <title>Error icon</title>
              <path
                fillRule="evenodd"
                d="M18 10c0 4.418-3.582 8-8 8S2 14.418 2 10 5.582 2 10 2s8 3.582 8 8zm-8-4a1 1 0 00-1 1v3a1 1 0 002 0V7a1 1 0 00-1-1zm0 7a1 1 0 100 2 1 1 0 000-2z"
                clipRule="evenodd"
              />
            </svg>
          )}
          {actionStatus.message}
        </div>
      )}

      {/* Header: label + refresh button */}
      <div className="mb-1 flex items-center justify-between px-1">
        <span className="flex min-w-0 items-baseline gap-1.5 text-body-md font-medium text-ink dark:text-dk-ink">
          <span>{isWorking ? "Saving" : mode === "files" ? "Upload files" : "Save"}</span>
          {mode === "files"
            ? hasPendingFiles &&
              pendingFilesLabel && (
                <span className="truncate text-body-sm font-normal text-muted dark:text-dk-muted">
                  {pendingFilesLabel}
                </span>
              )
            : activeUrl && (
                <span className="truncate text-body-sm font-normal text-muted dark:text-dk-muted">
                  {isWorking ? "…" : truncateUrl(activeUrl)}
                </span>
              )}
          <span>to:</span>
        </span>
        <div className="flex items-center gap-1.5">
          <input
            ref={fileInputRef}
            type="file"
            multiple
            className="hidden"
            onChange={(event) => {
              if (!event.target.files || event.target.files.length === 0) return;
              onPickFiles(event.target.files);
              event.target.value = "";
            }}
          />
          {mode === "files" && (
            <button
              type="button"
              title="Choose files"
              className="rounded px-2 py-1 text-label-sm font-medium text-primary transition-colors hover:bg-container-low disabled:cursor-not-allowed disabled:opacity-40 dark:text-dk-primary dark:hover:bg-dk-cont-low"
              onClick={() => fileInputRef.current?.click()}
              disabled={isWorking}
            >
              Choose files
            </button>
          )}
          <button
            type="button"
            title="Refresh notebooks"
            className="rounded p-1 text-muted transition-colors hover:bg-container-low hover:text-ink disabled:cursor-not-allowed disabled:opacity-40 dark:text-dk-muted dark:hover:bg-dk-cont-low dark:hover:text-dk-ink"
            onClick={onRefresh}
            disabled={isWorking || notebookStatus === "Loading notebooks..."}
          >
            <svg className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
              <title>Refresh icon</title>
              <path
                fillRule="evenodd"
                d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z"
                clipRule="evenodd"
              />
            </svg>
          </button>
        </div>
      </div>

      {mode === "files" && hasPendingFiles && (
        <div className="mb-2 flex items-center justify-between rounded-item bg-container-low px-3 py-1.5 text-body-sm text-muted dark:bg-dk-cont-low dark:text-dk-muted">
          <span>Files selected.</span>
          <button
            type="button"
            className="text-label-sm font-medium text-primary transition-colors hover:text-ink dark:text-dk-primary dark:hover:text-dk-ink"
            onClick={onClearFiles}
            disabled={isWorking}
          >
            Clear
          </button>
        </div>
      )}

      {/* Notebook picker */}
      <div className="overflow-hidden rounded-item border border-outline/60 bg-container shadow-elev2 dark:border-dk-outline/60 dark:bg-dk-container">
        {/* + New Notebook */}
        <button
          type="button"
          className="flex w-full items-center gap-2.5 px-3 py-2.5 text-left transition-colors hover:bg-container-low disabled:cursor-not-allowed disabled:opacity-60 dark:hover:bg-dk-cont-low"
          onClick={() => onSave({})}
          disabled={isWorking}
        >
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-[8px] bg-primary-cont dark:bg-dk-prim-cont">
            <svg
              className="h-3.5 w-3.5 text-primary dark:text-dk-primary"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <title>New notebook icon</title>
              <path d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" />
            </svg>
          </span>
          <span className="text-body-md font-medium text-primary dark:text-dk-primary">
            New notebook
          </span>
        </button>

        {/* Divider + existing notebooks */}
        {(notebookStatus || notebooks.length > 0) && (
          <div className="border-t border-outline/40 dark:border-dk-outline/40">
            {notebookStatus ? (
              <p className="px-3 py-2.5 text-body-sm text-muted dark:text-dk-muted">
                {notebookStatus}
              </p>
            ) : (
              <ul className="max-h-45 overflow-y-auto">
                {notebooks.map((notebook) => (
                  <li key={notebook.url}>
                    <button
                      type="button"
                      className="flex w-full items-center gap-2.5 px-3 py-2.5 text-left transition-colors hover:bg-container-low disabled:cursor-not-allowed disabled:opacity-60 dark:hover:bg-dk-cont-low"
                      onClick={() => onSave({ notebookId: notebook.id })}
                      disabled={isWorking}
                      title={`Add current tab to ${notebook.title}`}
                    >
                      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-[8px] bg-container-low text-sm dark:bg-dk-cont-low">
                        {notebook.emoji ?? "📓"}
                      </span>
                      <span className="min-w-0 flex-1 truncate text-body-md font-medium text-ink dark:text-dk-ink">
                        {notebook.title}
                      </span>
                      {typeof notebook.sourcesCount === "number" && (
                        <span className="shrink-0 rounded-chip bg-container-low px-1.5 py-0.5 text-label-sm text-muted dark:bg-dk-cont-low dark:text-dk-muted">
                          {notebook.sourcesCount}
                        </span>
                      )}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
