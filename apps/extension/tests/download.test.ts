import { describe, expect, it } from "vitest";
import {
  chooseBestDownloadUrl,
  decodeActionScript,
  extractJobIdFromBody,
  extractUrlsFromActionScript,
  isAsyncDownloadUrl,
  parseActionReference,
  parseAsyncDownloadMeta,
  parsePollResponse,
  scoreDownloadUrl,
} from "../src/d2l/download";

describe("parseActionReference", () => {
  it("extracts group and actionId from D2L.O call", () => {
    expect(parseActionReference("D2L.O('__g1',16)")).toEqual({
      group: "__g1",
      actionId: "16",
    });
  });

  it("handles double-quoted strings", () => {
    expect(parseActionReference('D2L.O("__g2", 42)')).toEqual({
      group: "__g2",
      actionId: "42",
    });
  });

  it("returns null for non-matching strings", () => {
    expect(parseActionReference("onclick()")).toBeNull();
    expect(parseActionReference("")).toBeNull();
  });
});

describe("decodeActionScript", () => {
  it("unescapes forward slashes and unicode ampersands", () => {
    expect(decodeActionScript("\\/path\\u0026key=val")).toBe("/path&key=val");
  });
});

describe("extractUrlsFromActionScript", () => {
  it("extracts unique URLs from Url keys", () => {
    const script =
      '{"Url":"\\/d2l\\/le\\/content\\/1\\/download"},{"Url":"\\/d2l\\/le\\/content\\/1\\/download"},{"Url":"\\/d2l\\/other"}';
    const urls = extractUrlsFromActionScript(script);
    expect(urls).toHaveLength(2);
    expect(urls).toContain("/d2l/le/content/1/download");
    expect(urls).toContain("/d2l/other");
  });
});

describe("scoreDownloadUrl", () => {
  it("scores DirectFileTopicDownload highest", () => {
    expect(
      scoreDownloadUrl("/d2l/le/content/123/topics/files/download/456/DirectFileTopicDownload")
    ).toBeGreaterThan(scoreDownloadUrl("/d2l/le/content/123/startdownload/InitiateModuleDownload"));
  });

  it("scores downloads/{type}/{id}/Download high", () => {
    expect(scoreDownloadUrl("/d2l/le/content/123/downloads/Module/789/Download")).toBe(100);
  });

  it("penalises CheckFileTopicInfo", () => {
    expect(scoreDownloadUrl("/d2l/le/content/123/CheckFileTopicInfo")).toBeLessThan(0);
  });

  it("penalises template URLs with braces", () => {
    expect(
      scoreDownloadUrl("/d2l/le/content/{orgUnitId}/downloads/{downloadType}/{jobId}/Download")
    ).toBeLessThan(scoreDownloadUrl("/d2l/le/content/123/downloads/Module/789/Download"));
  });
});

describe("chooseBestDownloadUrl", () => {
  it("picks DirectFileTopicDownload over InitiateModuleDownload", () => {
    const urls = [
      "/d2l/le/content/123/startdownload/InitiateModuleDownload",
      "/d2l/le/content/123/topics/files/download/456/DirectFileTopicDownload",
    ];
    expect(chooseBestDownloadUrl(urls)).toBe(
      "/d2l/le/content/123/topics/files/download/456/DirectFileTopicDownload"
    );
  });

  it("picks InitiateModuleDownload when no direct download exists", () => {
    const urls = [
      "/d2l/le/content/123/startdownload/InitiateModuleDownload?openerId=d2l_1",
      "/d2l/le/content/{orgUnitId}/downloads/{downloadType}/{jobId}/{action}",
    ];
    expect(chooseBestDownloadUrl(urls)).toBe(
      "/d2l/le/content/123/startdownload/InitiateModuleDownload?openerId=d2l_1"
    );
  });

  it("returns null for empty list", () => {
    expect(chooseBestDownloadUrl([])).toBeNull();
  });
});

describe("isAsyncDownloadUrl", () => {
  it("returns true for InitiateModuleDownload URLs", () => {
    expect(
      isAsyncDownloadUrl(
        "/d2l/le/content/1244041/6395886/startdownload/InitiateModuleDownload?openerId=d2l_1"
      )
    ).toBe(true);
  });

  it("returns true for InitiateTopicDownload URLs", () => {
    expect(
      isAsyncDownloadUrl(
        "/d2l/le/content/1244041/6407350/startdownload/InitiateTopicDownload?openerId=d2l_1"
      )
    ).toBe(true);
  });

  it("returns true for InitiateCourseDownload URLs", () => {
    expect(
      isAsyncDownloadUrl(
        "/d2l/le/content/1244041/startdownload/InitiateCourseDownload?openerId=d2l_1"
      )
    ).toBe(true);
  });

  it("returns false for direct download URLs", () => {
    expect(
      isAsyncDownloadUrl("/d2l/le/content/123/topics/files/download/456/DirectFileTopicDownload")
    ).toBe(false);
  });

  it("returns false for plain URLs", () => {
    expect(isAsyncDownloadUrl("/d2l/le/content/123/file.pdf")).toBe(false);
  });
});

describe("parseAsyncDownloadMeta", () => {
  it("extracts orgUnitId and downloadType from InitiateModuleDownload", () => {
    expect(
      parseAsyncDownloadMeta(
        "/d2l/le/content/1244041/6395886/startdownload/InitiateModuleDownload?openerId=d2l_1"
      )
    ).toEqual({ orgUnitId: "1244041", downloadType: "Module" });
  });

  it("extracts orgUnitId and downloadType from InitiateCourseDownload", () => {
    expect(
      parseAsyncDownloadMeta("/d2l/le/content/999/startdownload/InitiateCourseDownload?openerId=x")
    ).toEqual({ orgUnitId: "999", downloadType: "Course" });
  });

  it("extracts orgUnitId and downloadType from InitiateTopicDownload", () => {
    expect(
      parseAsyncDownloadMeta("/d2l/le/content/42/7777/startdownload/InitiateTopicDownload")
    ).toEqual({ orgUnitId: "42", downloadType: "Topic" });
  });

  it("returns null for non-initiate URLs", () => {
    expect(parseAsyncDownloadMeta("/d2l/le/content/123/file.pdf")).toBeNull();
  });

  it("returns null for URLs without content id", () => {
    expect(parseAsyncDownloadMeta("/d2l/startdownload/InitiateModuleDownload")).toBeNull();
  });
});

describe("extractJobIdFromBody", () => {
  it("extracts job ID from D2L HTML action scripts with escaped slashes", () => {
    // This is the real format: InitiateModuleDownload returns HTML with
    // action scripts containing JSON-escaped Poll URLs like \/downloads\/Module\/5056008\/Poll
    const body = `<html><script>D2L.OR={
"d2l_1_0_352":{"0":"{\\"_type\\":\\"pipe\\",\\"P\\":[{\\"_type\\":\\"func\\",\\"N\\":\\"D2L.VS\\",\\"P\\":[\\"DownloadProgressPollResultJSVariable\\",{\\"_type\\":\\"call\\",\\"N\\":\\"D2L.LP.Web.UI.Rpc.ConnectObject\\",\\"P\\":[\\"GET\\",{\\"_type\\":\\"url\\",\\"Url\\":\\"\\/d2l\\/le\\/content\\/1244041\\/downloads\\/Module\\/5056008\\/Poll\\"}]}]}]}"}
};</script></html>`;
    expect(extractJobIdFromBody(body)).toBe("5056008");
  });

  it("extracts ID from download URL pattern including Poll", () => {
    expect(extractJobIdFromBody('href="/d2l/le/content/123/downloads/Module/77777/Download"')).toBe(
      "77777"
    );
    expect(extractJobIdFromBody('url: "/d2l/le/content/123/downloads/Module/88888/Poll"')).toBe(
      "88888"
    );
  });

  it("extracts job ID from D2L while(1);JSON poll response", () => {
    const body = `while(1);{
    "_type": "D2L.LP.Web.UI.Html.JavaScript.Default.JsonActionResultPayload",
    "Payload": {
        "_type": "D2L.LE.Content.Domain.Downloads.DownloadProgressPollResult",
        "JobId": 5055994,
        "JobStatus": "Processing"
    },
    "RedirectLocation": null
}`;
    expect(extractJobIdFromBody(body)).toBe("5055994");
  });

  it("returns null when no patterns match", () => {
    expect(extractJobIdFromBody("<html><body>Hello</body></html>")).toBeNull();
  });

  it("returns null for empty body", () => {
    expect(extractJobIdFromBody("")).toBeNull();
  });
});

describe("parsePollResponse", () => {
  it("parses a D2L while(1);JSON poll response", () => {
    const body = `while(1);{
    "_type": "D2L.LP.Web.UI.Html.JavaScript.Default.JsonActionResultPayload",
    "Data": {
        "_type": "D2L.LP.Util.Dictionary",
        "session": {
            "_type": "D2L.LP.Auth.Web.Desktop.SessionExpiry.RpcPiggybackResponse",
            "HasExpired": false,
            "KeepAlive": false
        },
        "OR": { "_type": "D2L.LP.Util.Dictionary" }
    },
    "Payload": {
        "_type": "D2L.LE.Content.Domain.Downloads.DownloadProgressPollResult",
        "JobId": 5055994,
        "JobStatus": "Processing"
    },
    "RedirectLocation": null
}`;
    expect(parsePollResponse(body)).toEqual({
      jobId: 5055994,
      jobStatus: "Processing",
    });
  });

  it("parses a completed poll response", () => {
    const body =
      'while(1);{"Payload":{"JobId":123456,"JobStatus":"Complete"},"RedirectLocation":null}';
    expect(parsePollResponse(body)).toEqual({
      jobId: 123456,
      jobStatus: "Complete",
    });
  });

  it("parses a Successful poll response", () => {
    const body = `while(1);{
    "_type": "D2L.LP.Web.UI.Html.JavaScript.Default.JsonActionResultPayload",
    "Data": {
        "_type": "D2L.LP.Util.Dictionary",
        "session": {
            "_type": "D2L.LP.Auth.Web.Desktop.SessionExpiry.RpcPiggybackResponse",
            "HasExpired": false,
            "KeepAlive": false
        },
        "OR": { "_type": "D2L.LP.Util.Dictionary" }
    },
    "Payload": {
        "_type": "D2L.LE.Content.Domain.Downloads.DownloadProgressPollResult",
        "JobId": 5055994,
        "JobStatus": "Successful"
    },
    "RedirectLocation": null
}`;
    expect(parsePollResponse(body)).toEqual({
      jobId: 5055994,
      jobStatus: "Successful",
    });
  });

  it("returns null for non-JSON", () => {
    expect(parsePollResponse("<html>not json</html>")).toBeNull();
  });

  it("returns null for JSON without Payload", () => {
    expect(parsePollResponse('while(1);{"Data":{}}')).toBeNull();
  });

  it("returns null for empty string", () => {
    expect(parsePollResponse("")).toBeNull();
  });
});
