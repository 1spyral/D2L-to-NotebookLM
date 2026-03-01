import { describe, expect, it } from "vitest";
import {
  buildBatchBody,
  buildBatchUrl,
  parseAccountsListResponse,
  parseCreateNotebookResponse,
  parseNotebookListResponse,
  parseNotebookReadyResponse,
  parseTokensFromHtml,
} from "../src/lib/notebooklm/batchApi";

describe("NotebookLM batch API helpers", () => {
  it("parses tokens from HTML", () => {
    const html = '<html>"cfb2h":"bl-token","SNlM0e":"at-token"</html>';
    expect(parseTokensFromHtml(html)).toEqual({ bl: "bl-token", at: "at-token" });
  });

  it("parses notebook list response", () => {
    const inner = JSON.stringify([
      [
        ["Notebook A", ["source1"], "id-1", "BOOK", null, []],
        ["Hidden", [], "id-2", "BOOK", null, [3]],
      ],
    ]);
    const line = JSON.stringify([[null, null, inner]]);
    const response = `)]}'\n\n${line}\n`;

    const notebooks = parseNotebookListResponse(response, "https://notebooklm.google.com");
    expect(notebooks).toHaveLength(1);
    expect(notebooks[0]).toMatchObject({
      id: "id-1",
      title: "Notebook A",
      emoji: "BOOK",
      sourcesCount: 1,
    });
    expect(notebooks[0].url).toBe("https://notebooklm.google.com/notebook/id-1");
  });

  it("parses create notebook response", () => {
    const response = "random 123e4567-e89b-12d3-a456-426614174000 more text";
    expect(parseCreateNotebookResponse(response)).toBe("123e4567-e89b-12d3-a456-426614174000");
  });

  it("parses notebook ready response", () => {
    expect(parseNotebookReadyResponse('null,\\"abc"', "abc")).toBe(false);
    expect(parseNotebookReadyResponse("ready", "abc")).toBe(true);
  });

  it("parses accounts list response", () => {
    const accountsPayload = [
      null,
      [
        [
          null,
          null,
          "Test User",
          "test@example.com",
          "https://example.com/avatar.png",
          true,
          false,
          "0",
          null,
          null,
          "account-id",
        ],
      ],
    ];
    const encoded = JSON.stringify(accountsPayload)
      .replace(/\[/g, "\\x5b")
      .replace(/\]/g, "\\x5d")
      .replace(/"/g, "\\x22");
    const body = `postMessage('${encoded}', 'https://accounts.google.com')`;

    const accounts = parseAccountsListResponse(body);
    expect(accounts).toHaveLength(1);
    expect(accounts[0]).toMatchObject({
      name: "Test User",
      email: "test@example.com",
      index: "0",
      id: "account-id",
    });
  });

  it("builds batch request url and body", () => {
    const url = buildBatchUrl("https://notebooklm.google.com", {
      rpcId: "wXbhsf",
      sourcePath: "/",
      bl: "bl-token",
      reqId: "123456",
      authuser: "1",
    });
    expect(url).toContain("rpcids=wXbhsf");
    expect(url).toContain("source-path=%2F");
    expect(url).toContain("bl=bl-token");
    expect(url).toContain("_reqid=123456");
    expect(url).toContain("authuser=1");

    const body = buildBatchBody("wXbhsf", JSON.stringify([null, 1]), "at-token");
    const params = new URLSearchParams(body);
    expect(params.get("at")).toBe("at-token");
    const parsed = JSON.parse(params.get("f.req") ?? "null");
    expect(parsed[0][0][0]).toBe("wXbhsf");
  });
});
