/**
 * Tests for the logic exported by content_d2l.ts.
 *
 * Importing the module fires init() as a side-effect (MutationObserver +
 * scheduled runInjections calls). We tame those with vi.useFakeTimers() and
 * stub every external dependency so no browser extension APIs are touched.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// ---------------------------------------------------------------------------
// Hoist mocks – must be set up *before* the module under test is imported
// ---------------------------------------------------------------------------
vi.mock("../src/d2l/notebookPicker", () => ({
  showNotebookPicker: vi.fn(),
  saveSourcesToNotebook: vi.fn(),
}));

vi.mock("../src/d2l/download", () => ({
  extractDownloadUrlFromButton: vi.fn().mockReturnValue(null),
  captureDownloadUrlViaClick: vi.fn().mockResolvedValue(null),
  fetchDownloadFile: vi.fn().mockResolvedValue(null),
  isZipFile: vi.fn().mockReturnValue(false),
  unzipFile: vi.fn().mockResolvedValue([]),
}));

// ---------------------------------------------------------------------------
// Import the functions under test after mocks are registered
// ---------------------------------------------------------------------------
import { getNotebookTitle, insertDownloadButtons } from "../src/content_d2l";

// ---------------------------------------------------------------------------
// Test helpers
// ---------------------------------------------------------------------------
function makeDownloadButton(text = "Download"): HTMLButtonElement {
  const btn = document.createElement("button");
  btn.className = "d2l-button";
  btn.textContent = text;
  return btn;
}

// ---------------------------------------------------------------------------
// getNotebookTitle
// ---------------------------------------------------------------------------
describe("getNotebookTitle", () => {
  afterEach(() => {
    document.body.innerHTML = "";
    document.title = "";
  });

  it("returns the text of h1.d2l-page-title when present", () => {
    document.body.innerHTML = '<h1 class="d2l-page-title">Introduction to Biology</h1>';
    expect(getNotebookTitle()).toBe("Introduction to Biology");
  });

  it("falls back to document title when the heading is 'Table of Contents'", () => {
    document.body.innerHTML = '<h1 class="d2l-page-title">Table of Contents</h1>';
    document.title = "Table of Contents - BIOL 101";
    expect(getNotebookTitle()).toBe("BIOL 101");
  });

  it("is case-insensitive for the Table of Contents check", () => {
    document.body.innerHTML = '<h1 class="d2l-page-title">table of contents</h1>';
    document.title = "Anything - My Course";
    expect(getNotebookTitle()).toBe("My Course");
  });

  it("uses the last segment of a multi-dash document title", () => {
    document.body.innerHTML = '<h1 class="d2l-page-title">Table of Contents</h1>';
    document.title = "Page - Section - My Course Name";
    expect(getNotebookTitle()).toBe("Section - My Course Name");
  });

  it("falls back to 'D2L Imports' when there is no heading and no title separator", () => {
    document.body.innerHTML = "";
    document.title = "NoDash";
    expect(getNotebookTitle()).toBe("D2L Imports");
  });

  it("falls back to 'D2L Imports' when there is no heading and title is empty", () => {
    document.body.innerHTML = "";
    document.title = "";
    expect(getNotebookTitle()).toBe("D2L Imports");
  });
});

// ---------------------------------------------------------------------------
// insertDownloadButtons
// ---------------------------------------------------------------------------
describe("insertDownloadButtons", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    document.body.innerHTML = "";
  });

  afterEach(() => {
    vi.useRealTimers();
    document.body.innerHTML = "";
  });

  it("inserts a sibling 'Download to NotebookLM' button after each Download button", () => {
    document.body.appendChild(makeDownloadButton());

    insertDownloadButtons();

    const injected = document.body.querySelector("[data-d2l-to-notebooklm-download-button='1']");
    expect(injected).not.toBeNull();
    expect(injected?.textContent).toBe("Download to NotebookLM");
  });

  it("places the injected button immediately after the original", () => {
    const original = makeDownloadButton();
    document.body.appendChild(original);

    insertDownloadButtons();

    expect(original.nextElementSibling?.textContent).toBe("Download to NotebookLM");
  });

  it("marks the original button as enhanced", () => {
    const original = makeDownloadButton();
    document.body.appendChild(original);

    insertDownloadButtons();

    expect(original.dataset.d2lToNotebooklmDownloadEnhanced).toBe("1");
  });

  it("is idempotent – calling twice does not add a second injected button", () => {
    document.body.appendChild(makeDownloadButton());

    insertDownloadButtons();
    insertDownloadButtons();

    const injected = document.body.querySelectorAll("[data-d2l-to-notebooklm-download-button='1']");
    expect(injected).toHaveLength(1);
  });

  it("handles multiple Download buttons on the page independently", () => {
    document.body.appendChild(makeDownloadButton());
    document.body.appendChild(makeDownloadButton());

    insertDownloadButtons();

    const injected = document.body.querySelectorAll("[data-d2l-to-notebooklm-download-button='1']");
    expect(injected).toHaveLength(2);
  });

  it("does not inject buttons for buttons that don't say 'Download'", () => {
    document.body.appendChild(makeDownloadButton("Submit"));

    insertDownloadButtons();

    const injected = document.body.querySelector("[data-d2l-to-notebooklm-download-button='1']");
    expect(injected).toBeNull();
  });

  it("does not inject when an injected sibling already exists (pre-existing markup)", () => {
    const original = makeDownloadButton();
    const preExisting = document.createElement("button");
    preExisting.dataset.d2lToNotebooklmDownloadButton = "1";
    preExisting.textContent = "Download to NotebookLM";
    document.body.appendChild(original);
    document.body.appendChild(preExisting);

    insertDownloadButtons();

    const injected = document.body.querySelectorAll("[data-d2l-to-notebooklm-download-button='1']");
    expect(injected).toHaveLength(1);
  });
});
