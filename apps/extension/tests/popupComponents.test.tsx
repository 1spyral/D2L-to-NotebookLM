import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { DarkModeToggle } from "../src/popup/components/DarkModeToggle";
import { SaveUrlMenu } from "../src/popup/components/SaveUrlMenu";

afterEach(() => {
  cleanup();
});

describe("DarkModeToggle", () => {
  it("renders switch semantics and toggles on click", () => {
    const onToggle = vi.fn();
    render(<DarkModeToggle darkMode={false} onToggle={onToggle} />);

    const button = screen.getByRole("switch", { name: "Switch to dark mode" });
    expect(button.getAttribute("aria-checked")).toBe("false");

    fireEvent.click(button);
    expect(onToggle).toHaveBeenCalledTimes(1);
  });
});

describe("SaveUrlMenu", () => {
  const baseProps = {
    mode: "url" as const,
    isWorking: false,
    actionStatus: null,
    notebookStatus: "",
    notebooks: [
      {
        id: "nb-1",
        title: "Research Notes",
        url: "https://notebooklm.google.com/notebook/nb-1",
        emoji: "📘",
        sourcesCount: 4,
      },
    ],
    activeUrl: "https://example.com/very/long/path?query=1",
    pendingFilesLabel: undefined,
    hasPendingFiles: false,
    onSave: vi.fn(),
    onRefresh: vi.fn(),
    onPickFiles: vi.fn(),
    onClearFiles: vi.fn(),
  };

  it("matches snapshot in URL mode", () => {
    const { asFragment } = render(<SaveUrlMenu {...baseProps} />);
    expect(asFragment()).toMatchSnapshot();
  });

  it("matches snapshot in files mode with pending files", () => {
    const { asFragment } = render(
      <SaveUrlMenu {...baseProps} mode="files" hasPendingFiles pendingFilesLabel="2 files" />
    );

    expect(asFragment()).toMatchSnapshot();
  });

  it("calls action handlers for refresh, save, and clear", () => {
    const onSave = vi.fn();
    const onRefresh = vi.fn();
    const onClearFiles = vi.fn();
    render(
      <SaveUrlMenu
        {...baseProps}
        mode="files"
        hasPendingFiles
        pendingFilesLabel="2 files"
        onSave={onSave}
        onRefresh={onRefresh}
        onClearFiles={onClearFiles}
      />
    );

    fireEvent.click(screen.getByTitle("Refresh notebooks"));
    expect(onRefresh).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByText("New notebook"));
    expect(onSave).toHaveBeenCalledWith({});

    fireEvent.click(screen.getByText("Research Notes"));
    expect(onSave).toHaveBeenCalledWith({ notebookId: "nb-1" });

    fireEvent.click(screen.getByText("Clear"));
    expect(onClearFiles).toHaveBeenCalledTimes(1);
  });
});
