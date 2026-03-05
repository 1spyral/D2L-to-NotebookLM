import type { NotebookLmSource, NotebookPickerTarget } from "./d2l/types";
import {
  queryAllDeep,
  normalizeText,
  createActionButton,
  setButtonBusy,
  setButtonStatus,
} from "./d2l/dom";
import { showNotebookPicker, saveSourcesToNotebook } from "./d2l/notebookPicker";
import {
  captureDownloadUrlViaClick,
  extractDownloadUrlFromButton,
  fetchDownloadFile,
  isZipFile,
  unzipFile,
} from "./d2l/download";

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
        if (extractedFiles.length === 0) {
          throw new Error("Downloaded ZIP file was empty after extraction.");
        }

        sources = extractedFiles.map((file) => ({ file, title: file.name }));
      } else {
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
      const results = await Promise.all(
        remaining.map((source, i) =>
          saveSourcesToNotebook(
            [source],
            getNotebookTitle(),
            { notebookId: notebookId! },
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

function getCourseIdFromHref(href: string): string | null {
  try {
    const parsed = new URL(href, window.location.origin);
    const match = parsed.pathname.match(/\/home\/(\d+)(?:\/|$)/);
    return match?.[1] ?? null;
  } catch {
    return null;
  }
}

function isInOrUnderHost(node: Node, host: Element): boolean {
  let current: Node | null = node;

  while (current) {
    if (current === host) {
      return true;
    }

    const rootNode = current.getRootNode();
    if (rootNode instanceof ShadowRoot) {
      current = rootNode.host;
      continue;
    }

    current = current.parentNode;
  }

  return false;
}

function findCourseLinkTargets(hosts: Element[]): HTMLAnchorElement[] {
  const targets: HTMLAnchorElement[] = [];

  for (const element of queryAllDeep("a[href]")) {
    if (!(element instanceof HTMLAnchorElement)) {
      continue;
    }

    if (!getCourseIdFromHref(element.href)) {
      continue;
    }

    if (!hosts.some((host) => isInOrUnderHost(element, host))) {
      continue;
    }

    targets.push(element);
  }

  return targets;
}

async function handleCourseButtonAction(
  courseLink: HTMLAnchorElement,
  actionButton: HTMLButtonElement,
  target: NotebookPickerTarget
): Promise<void> {
  const restore = setButtonBusy(actionButton, "Adding...");

  try {
    const courseTitle = normalizeText(courseLink.textContent ?? "") || "D2L Course";
    const response = await saveSourcesToNotebook(
      [{ url: courseLink.href, title: courseTitle }],
      getNotebookTitle(),
      target
    );

    if (!response.ok) {
      throw new Error(response.error);
    }

    setButtonStatus(actionButton, "Added");
  } catch (error) {
    console.error("[D2L->NotebookLM] Failed to add course:", error);
    setButtonStatus(actionButton, "Failed", 2500);
  } finally {
    restore();
  }
}

function insertCourseBoxButtons(): void {
  const myCoursesHosts = queryAllDeep("d2l-my-courses");
  if (myCoursesHosts.length === 0) {
    return;
  }

  const courseLinks = findCourseLinkTargets(myCoursesHosts);

  for (const courseLink of courseLinks) {
    const courseId = getCourseIdFromHref(courseLink.href);
    if (!courseId) {
      continue;
    }

    if (courseLink.dataset.d2lToNotebooklmCourseEnhanced === "1") {
      continue;
    }

    const existingSibling = courseLink.nextElementSibling;
    if (
      existingSibling instanceof HTMLElement &&
      existingSibling.dataset.d2lToNotebooklmCourseButton === courseId
    ) {
      courseLink.dataset.d2lToNotebooklmCourseEnhanced = "1";
      continue;
    }

    const wrapper = document.createElement("span");
    wrapper.dataset.d2lToNotebooklmCourseButton = courseId;
    wrapper.style.display = "inline-flex";
    wrapper.style.alignItems = "center";

    const actionButton = createActionButton("Download to NotebookLM");
    actionButton.addEventListener("click", (event) => {
      event.preventDefault();
      showNotebookPicker(actionButton, (target) => {
        void handleCourseButtonAction(courseLink, actionButton, target);
      });
    });

    wrapper.append(actionButton);
    courseLink.insertAdjacentElement("afterend", wrapper);
    courseLink.dataset.d2lToNotebooklmCourseEnhanced = "1";
  }
}

function runInjections(): void {
  cleanupLegacyNavbarButton();
  insertDownloadButtons();
  insertCourseBoxButtons();
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
