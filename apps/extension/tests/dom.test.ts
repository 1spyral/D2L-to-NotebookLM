import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  createActionButton,
  normalizeText,
  queryAllDeep,
  setButtonBusy,
  setButtonStatus,
} from "../src/d2l/dom";

// ---------------------------------------------------------------------------
// normalizeText
// ---------------------------------------------------------------------------
describe("normalizeText", () => {
  it("collapses internal whitespace to single spaces", () => {
    expect(normalizeText("  hello   world  ")).toBe("hello world");
  });

  it("handles tabs and newlines", () => {
    expect(normalizeText("\t foo\n  bar\t")).toBe("foo bar");
  });

  it("returns empty string for whitespace-only input", () => {
    expect(normalizeText("   ")).toBe("");
  });

  it("leaves already-normalised strings unchanged", () => {
    expect(normalizeText("hello world")).toBe("hello world");
  });
});

// ---------------------------------------------------------------------------
// queryAllDeep
// ---------------------------------------------------------------------------
describe("queryAllDeep", () => {
  let container: HTMLDivElement;

  beforeEach(() => {
    container = document.createElement("div");
    document.body.appendChild(container);
  });

  afterEach(() => {
    container.remove();
  });

  it("finds elements in the regular DOM", () => {
    container.innerHTML = '<button class="d2l-button">Download</button>';
    const results = queryAllDeep("button.d2l-button", container);
    expect(results).toHaveLength(1);
    expect(results[0].textContent).toBe("Download");
  });

  it("finds multiple matching elements", () => {
    container.innerHTML =
      '<button class="d2l-button">A</button><button class="d2l-button">B</button>';
    const results = queryAllDeep("button.d2l-button", container);
    expect(results).toHaveLength(2);
  });

  it("finds elements inside an open shadow root", () => {
    const host = document.createElement("div");
    container.appendChild(host);
    const shadow = host.attachShadow({ mode: "open" });
    const inner = document.createElement("button");
    inner.className = "d2l-button";
    inner.textContent = "Shadow Button";
    shadow.appendChild(inner);

    const results = queryAllDeep("button.d2l-button", container);
    expect(results).toHaveLength(1);
    expect(results[0].textContent).toBe("Shadow Button");
  });

  it("does not return duplicates when elements appear in multiple traversals", () => {
    // Nested containers that both match the flat querySelectorAll
    container.innerHTML = '<div><button class="d2l-button">X</button></div>';
    const results = queryAllDeep("button.d2l-button", container);
    expect(results).toHaveLength(1);
  });

  it("returns empty array when no elements match", () => {
    container.innerHTML = "<p>no buttons here</p>";
    expect(queryAllDeep("button.d2l-button", container)).toHaveLength(0);
  });

  it("defaults to document as root", () => {
    container.innerHTML = '<span class="marker">hi</span>';
    const results = queryAllDeep("span.marker");
    expect(results.length).toBeGreaterThanOrEqual(1);
  });
});

// ---------------------------------------------------------------------------
// createActionButton
// ---------------------------------------------------------------------------
describe("createActionButton", () => {
  it("creates a button element with the correct label", () => {
    const button = createActionButton("Download to NotebookLM");
    expect(button.tagName).toBe("BUTTON");
    expect(button.type).toBe("button");
    expect(button.textContent).toBe("Download to NotebookLM");
  });

  it("copies d2l-button-* classes from the template", () => {
    const template = document.createElement("button");
    template.classList.add("d2l-button", "d2l-button-primary");

    const button = createActionButton("Test", template);
    expect(button.classList.contains("d2l-button")).toBe(true);
    expect(button.classList.contains("d2l-button-primary")).toBe(true);
  });

  it("falls back to d2l-button class when no template is provided", () => {
    const button = createActionButton("Test");
    expect(button.classList.contains("d2l-button")).toBe(true);
  });

  it("adds custom action styles", () => {
    const button = createActionButton("Test");
    expect(button.style.backgroundColor).toBeTruthy();
    expect(button.style.color).toBeTruthy();
  });
});

// ---------------------------------------------------------------------------
// setButtonBusy
// ---------------------------------------------------------------------------
describe("setButtonBusy", () => {
  it("disables the button and shows the busy label", () => {
    const button = document.createElement("button");
    button.textContent = "Download to NotebookLM";

    setButtonBusy(button, "Adding...");

    expect(button.disabled).toBe(true);
    expect(button.textContent).toBe("Adding...");
  });

  it("stores the original label in data-originalLabel", () => {
    const button = document.createElement("button");
    button.textContent = "Download to NotebookLM";

    setButtonBusy(button, "Adding...");

    expect(button.dataset.originalLabel).toBe("Download to NotebookLM");
  });

  it("returns a restore function that re-enables the button", () => {
    const button = document.createElement("button");
    button.textContent = "Download to NotebookLM";

    const restore = setButtonBusy(button, "Adding...");
    restore();

    expect(button.disabled).toBe(false);
    expect(button.textContent).toBe("Download to NotebookLM");
    expect(button.dataset.originalLabel).toBeUndefined();
  });

  it("handles an empty original label without throwing", () => {
    const button = document.createElement("button");
    // textContent is "" by default

    const restore = setButtonBusy(button, "Busy");
    expect(button.disabled).toBe(true);
    restore();
    expect(button.disabled).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// setButtonStatus
// ---------------------------------------------------------------------------
describe("setButtonStatus", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("immediately updates the button text to the status label", () => {
    const button = document.createElement("button");
    button.textContent = "Download to NotebookLM";

    setButtonStatus(button, "Added");

    expect(button.textContent).toBe("Added");
  });

  it("reverts to the original text after the timeout", () => {
    const button = document.createElement("button");
    button.textContent = "Download to NotebookLM";

    setButtonStatus(button, "Added", 1800);
    vi.advanceTimersByTime(1800);

    expect(button.textContent).toBe("Download to NotebookLM");
  });

  it("reads original label from data-originalLabel when in busy state", () => {
    const button = document.createElement("button");
    button.textContent = "Adding..."; // busy-state text
    button.dataset.originalLabel = "Download to NotebookLM";

    setButtonStatus(button, "Added", 1800);
    vi.advanceTimersByTime(1800);

    expect(button.textContent).toBe("Download to NotebookLM");
  });

  it("does not revert before the timeout elapses", () => {
    const button = document.createElement("button");
    button.textContent = "Download to NotebookLM";

    setButtonStatus(button, "Added", 1800);
    vi.advanceTimersByTime(1799);

    expect(button.textContent).toBe("Added");
  });
});
