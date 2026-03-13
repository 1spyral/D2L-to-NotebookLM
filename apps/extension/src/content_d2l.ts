import {
  createActionButton,
  normalizeText,
  queryAllDeep,
  setButtonBusy,
  setButtonStatus,
} from "./d2l/dom";
import {
  captureDownloadUrlViaClick,
  extractDownloadUrlFromButton,
  fetchDownloadFile,
  isZipFile,
  unzipFile,
} from "./d2l/download";
import { saveSourcesToNotebook, showNotebookPicker } from "./d2l/notebookPicker";
import type { NotebookLmSource, NotebookPickerTarget } from "./d2l/types";

const LEGACY_NAVBAR_BUTTON_ID = "d2l-to-notebooklm-navbar-button";

export function getNotebookTitle(): string {
  // Use the section name from the page heading, unless it's the top-level
  // "Table of Contents" — in that case fall back to the course name.
  const heading = document.querySelector("h1.d2l-page-title");
  const sectionName = heading?.textContent?.trim();
  if (sectionName && !/^table of contents$/i.test(sectionName)) {
    return sectionName;
  }
  // Course name from the document title ("PageName - CourseName")
  const parts = document.title.split(" - ");
  if (parts.length >= 2) {
    return parts.slice(1).join(" - ").trim();
  }
  return "D2L Imports";
}

function cleanupLegacyNavbarButton(): void {
  const oldButtons = queryAllDeep(`#${LEGACY_NAVBAR_BUTTON_ID}`);
  for (const element of oldButtons) {
    element.remove();
  }
}

async function handleDownloadButtonAction(
  originalDownloadButton: HTMLButtonElement,
  actionButton: HTMLButtonElement,
  target: NotebookPickerTarget
): Promise<void> {
  const restore = setButtonBusy(actionButton, "Adding...");

  try {
    let downloadUrl = extractDownloadUrlFromButton(originalDownloadButton);
    if (!downloadUrl) {
      downloadUrl = await captureDownloadUrlViaClick(originalDownloadButton);
    }
    const downloadedFile = downloadUrl
      ? await fetchDownloadFile(downloadUrl, (status) => {
          actionButton.textContent = status;
        })
      : null;

    let sources: NotebookLmSource[];
    if (downloadedFile) {
      if (isZipFile(downloadedFile)) {
        const extractedFiles = await unzipFile(downloadedFile);
        // Filter out "table of contents.html"
        const filteredFiles = extractedFiles.filter(
          (file) => file.name.toLowerCase() !== "table of contents.html"
        );

        if (filteredFiles.length === 0) {
          throw new Error("No files found to upload (excluding Table of Contents).");
        }

        sources = filteredFiles.map((file) => ({ file, title: file.name }));
      } else {
        // Even for single files, filter if it's the table of contents
        if (downloadedFile.name.toLowerCase() === "table of contents.html") {
          throw new Error("The selected file is a Table of Contents and will be ignored.");
        }
        sources = [{ file: downloadedFile, title: downloadedFile.name }];
      }
    } else {
      throw new Error("Could not download file from D2L.");
    }

    // Send sources one at a time to stay under Chrome's 64 MiB message limit.
    // The first upload is sequential (it may create the notebook), then the
    // rest run in parallel.
    let notebookId = target.notebookId;
    let added = 0;
    const total = sources.length;

    function updateProgress() {
      actionButton.textContent = `Uploaded ${added}/${total}…`;
    }

    if (total > 0) {
      actionButton.textContent = `Uploading 0/${total}…`;
      const firstTarget: typeof target = notebookId ? { notebookId } : target;
      const firstResponse = await saveSourcesToNotebook(
        [sources[0]],
        getNotebookTitle(),
        firstTarget,
        total > 1
      );

      if (firstResponse.ok) {
        added += 1;
        if (firstResponse.notebookId) notebookId = firstResponse.notebookId;
      } else {
        console.warn("[D2L→NLM] skipped source:", sources[0].title, firstResponse.error);
      }
      updateProgress();
    }

    if (total > 1 && notebookId) {
      const remaining = sources.slice(1);
      const resolvedNotebookId = notebookId;
      await Promise.all(
        remaining.map((source, i) =>
          saveSourcesToNotebook(
            [source],
            getNotebookTitle(),
            { notebookId: resolvedNotebookId },
            i < remaining.length - 1
          ).then((response) => {
            if (response.ok) {
              added += 1;
            } else {
              console.warn("[D2L→NLM] skipped source:", source.title, response.error);
            }
            updateProgress();
            return response;
          })
        )
      );
    }

    if (added === 0) {
      throw new Error("No files were accepted by NotebookLM.");
    }

    setButtonStatus(
      actionButton,
      added < sources.length ? `Added ${added}/${sources.length}` : "Added"
    );
  } catch (error) {
    console.error("[D2L->NotebookLM] Failed to add downloaded item:", error);
    setButtonStatus(actionButton, "Failed", 2500);
  } finally {
    restore();
  }
}

export function insertDownloadButtons(): void {
  const candidates = queryAllDeep("button.d2l-button");

  for (const element of candidates) {
    if (!(element instanceof HTMLButtonElement)) {
      continue;
    }

    if (element.dataset.d2lToNotebooklmDownloadEnhanced === "1") {
      continue;
    }

    if (normalizeText(element.textContent ?? "") !== "Download") {
      continue;
    }

    const existingSibling = element.nextElementSibling;
    if (
      existingSibling instanceof HTMLElement &&
      existingSibling.dataset.d2lToNotebooklmDownloadButton === "1"
    ) {
      element.dataset.d2lToNotebooklmDownloadEnhanced = "1";
      continue;
    }

    const actionButton = createActionButton("Download to NotebookLM", element);
    actionButton.dataset.d2lToNotebooklmDownloadButton = "1";
    actionButton.addEventListener("click", (event) => {
      event.preventDefault();
      showNotebookPicker(actionButton, (target) => {
        void handleDownloadButtonAction(element, actionButton, target);
      });
    });

    element.insertAdjacentElement("afterend", actionButton);
    element.dataset.d2lToNotebooklmDownloadEnhanced = "1";
  }
}

function runInjections(): void {
  cleanupLegacyNavbarButton();
  insertDownloadButtons();
}

function init(): void {
  runInjections();

  const observer = new MutationObserver(() => {
    runInjections();
  });

  observer.observe(document.documentElement, {
    childList: true,
    subtree: true,
  });

  for (let i = 0; i < 12; i += 1) {
    setTimeout(runInjections, 300 * (i + 1));
  }
}

init();
