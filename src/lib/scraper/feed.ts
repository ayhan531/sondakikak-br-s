import Parser from "rss-parser";
import { fetchText } from "./http";

export type FeedItem = {
  title: string;
  link: string;
  publishedAt: Date | null;
  summaryHtml: string;
  contentHtml: string;
  categories: string[];
  author?: string;
  imageUrl?: string;
};

type CustomItem = {
  "content:encoded"?: string;
  "media:content"?: { $?: { url?: string } } | Array<{ $?: { url?: string } }>;
  "media:thumbnail"?: { $?: { url?: string } };
  enclosure?: { url?: string; type?: string };
  "dc:creator"?: string;
};

const parser: Parser<object, CustomItem> = new Parser({
  customFields: {
    item: [
      "content:encoded",
      "media:content",
      "media:thumbnail",
      "dc:creator",
    ],
  },
});

function firstMediaUrl(item: CustomItem): string | undefined {
  const enclosure = item.enclosure;
  if (enclosure?.url && (enclosure.type ?? "").startsWith("image")) return enclosure.url;
  if (enclosure?.url && /\.(jpe?g|png|webp|avif|gif)/i.test(enclosure.url)) return enclosure.url;

  const media = item["media:content"];
  if (Array.isArray(media)) {
    const found = media.find((m) => m?.$?.url);
    if (found?.$?.url) return found.$.url;
  } else if (media?.$?.url) {
    return media.$.url;
  }

  const thumb = item["media:thumbnail"];
  if (thumb?.$?.url) return thumb.$.url;

  return undefined;
}

/** HTML parçasındaki ilk <img src> değerini döndürür. */
export function firstImageInHtml(html: string): string | undefined {
  const match = /<img[^>]+src=["']([^"']+)["']/i.exec(html);
  if (!match) return undefined;
  const url = match[1];
  // 1x1 piksel takip görsellerini ve data URI'leri atla
  if (url.startsWith("data:")) return undefined;
  return url;
}

/** RSS/Atom beslemesini indirir ve normalize edilmiş haber listesi döndürür. */
export async function parseFeed(feedUrl: string): Promise<FeedItem[]> {
  const res = await fetchText(feedUrl, {
    accept: "application/rss+xml,application/xml,text/xml;q=0.9,*/*;q=0.8",
  });
  if (!res.ok || !res.body.trim()) {
    throw new Error(res.error ? `${feedUrl}: ${res.error}` : `${feedUrl}: HTTP ${res.status}`);
  }

  const feed = await parser.parseString(res.body);

  return (feed.items ?? [])
    .map((raw): FeedItem | null => {
      const item = raw as Parser.Item & CustomItem;
      const link = (item.link ?? "").trim();
      const title = (item.title ?? "").replace(/\s+/g, " ").trim();
      if (!link || !title) return null;

      const contentHtml = (item["content:encoded"] ?? item.content ?? "").trim();
      const summaryHtml = (item.contentSnippet ? item.content ?? "" : item.content ?? "").trim();

      const published = item.isoDate ?? item.pubDate;
      const publishedAt = published ? new Date(published) : null;

      return {
        title,
        link,
        publishedAt: publishedAt && !Number.isNaN(publishedAt.getTime()) ? publishedAt : null,
        summaryHtml,
        contentHtml,
        categories: (item.categories ?? []).map((c) => String(c).trim()).filter(Boolean),
        author: item["dc:creator"] ?? item.creator ?? undefined,
        imageUrl: firstMediaUrl(item) ?? firstImageInHtml(contentHtml || summaryHtml),
      };
    })
    .filter((item): item is FeedItem => item !== null);
}
