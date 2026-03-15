import { describe, expect, it } from "vitest";
import { isSupportedFile } from "../src/lib/notebooklm/utils";

describe("isSupportedFile", () => {
  it("returns true for supported file extensions", () => {
    const supported = [
      "test.pdf",
      "README.md",
      "notes.txt",
      "data.csv",
      "book.epub",
      "image.png",
      "photo.jpg",
      "animation.gif",
      "track.mp3",
      "video.mp4",
    ];
    for (const fileName of supported) {
      expect(isSupportedFile(fileName)).toBe(true);
    }
  });

  it("returns false for unsupported file extensions", () => {
    const unsupported = [
      "index.html",
      "styles.css",
      "script.js",
      "archive.zip",
      "config.json",
      "document.rtf",
      "presentation.pptx", // Wait, user didn't list .pptx in their "only" list
    ];
    for (const fileName of unsupported) {
      expect(isSupportedFile(fileName)).toBe(false);
    }
  });

  it("is case-insensitive", () => {
    expect(isSupportedFile("TEST.PDF")).toBe(true);
    expect(isSupportedFile("Notes.Txt")).toBe(true);
  });

  it("returns false for files without extensions", () => {
    expect(isSupportedFile("README")).toBe(false);
  });

  it("returns false for empty filenames", () => {
    expect(isSupportedFile("")).toBe(false);
  });
});
