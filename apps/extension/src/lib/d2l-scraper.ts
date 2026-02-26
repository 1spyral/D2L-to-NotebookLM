export interface ScrapedItem {
  id: string;
  title: string;
  url: string;
  type: "file" | "link";
  data?: string;
  mimeType?: string;
}

interface D2LTopic {
  TopicId: number;
  Title: string;
  Url: string;
  TopicType: number;
}

interface D2LModule {
  Topics?: D2LTopic[];
  Modules?: D2LModule[];
}

const D2L_API_VERSION = "1.25"; // Waterloo uses 1.25+

export async function scrapeCourseTOC(orgUnitId: string): Promise<ScrapedItem[]> {
  const tocUrl = `/d2l/api/le/${D2L_API_VERSION}/${orgUnitId}/content/toc`;
  const response = await fetch(tocUrl);
  const toc = await response.json();
  const items: ScrapedItem[] = [];

  function process(mod: D2LModule) {
    if (mod.Topics) {
      for (const t of mod.Topics) {
        if (t.TopicType === 1 || t.TopicType === 3) {
          items.push({
            id: t.TopicId.toString(),
            title: t.Title,
            url: t.Url,
            type: t.TopicType === 1 ? "file" : "link",
          });
        }
      }
    }
    if (mod.Modules) {
      for (const subMod of mod.Modules) {
        process(subMod);
      }
    }
  }
  if (toc.Modules) {
    for (const mod of toc.Modules as D2LModule[]) {
      process(mod);
    }
  }
  return items;
}

export async function downloadFileAsBase64(
  item: ScrapedItem,
  orgUnitId: string
): Promise<Partial<ScrapedItem>> {
  if (item.type === "link") return { data: item.url };

  // WATERLOO FIX: Target the DirectFile download endpoint to get the PDF, not the viewer HTML
  const downloadUrl = `/d2l/le/content/${orgUnitId}/topics/files/download/${item.id}/DirectFile`;

  const response = await fetch(downloadUrl);
  const blob = await response.blob();

  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () =>
      resolve({
        data: reader.result as string,
        mimeType: blob.type,
      });
    reader.readAsDataURL(blob);
  });
}
