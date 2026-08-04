import { Readability } from "@mozilla/readability";
import { JSDOM, VirtualConsole } from "jsdom";
import * as cheerio from "cheerio";
import { fetchText } from "./http";
import { cleanArticleHtml } from "./clean";

export type ExtractedArticle = {
  title?: string;
  contentHtml: string;
  imageUrl?: string;
  publishedAt?: Date;
  author?: string;
  description?: string;
  sectionHint?: string;
};

type JsonLdNode = Record<string, unknown>;

function decodeEntities(value: string): string {
  return value
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&nbsp;/g, " ");
}

function parseDate(value: unknown): Date | undefined {
  if (typeof value !== "string" || !value.trim()) return undefined;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? undefined : date;
}

/** Sayfadaki JSON-LD bloklarından NewsArticle/Article düğümünü bulur. */
function findNewsArticleLd($: cheerio.CheerioAPI): JsonLdNode | undefined {
  const nodes: JsonLdNode[] = [];

  $('script[type="application/ld+json"]').each((_, el) => {
    const raw = $(el).contents().text().trim();
    if (!raw) return;
    try {
      const parsed = JSON.parse(raw);
      const queue = Array.isArray(parsed) ? [...parsed] : [parsed];
      while (queue.length) {
        const node = queue.shift();
        if (!node || typeof node !== "object") continue;
        const record = node as JsonLdNode;
        if (Array.isArray(record["@graph"])) queue.push(...(record["@graph"] as JsonLdNode[]));
        nodes.push(record);
      }
    } catch {
      // Bozuk JSON-LD'yi sessizce atla
    }
  });

  return nodes.find((node) => {
    const type = node["@type"];
    const types = Array.isArray(type) ? type : [type];
    return types.some((t) => typeof t === "string" && /article|newsarticle|blogposting/i.test(t));
  });
}

function firstString(value: unknown): string | undefined {
  if (typeof value === "string") return value;
  if (Array.isArray(value)) {
    for (const entry of value) {
      const found = firstString(entry);
      if (found) return found;
    }
    return undefined;
  }
  if (value && typeof value === "object") {
    const record = value as JsonLdNode;
    return firstString(record.url ?? record.contentUrl ?? record.name);
  }
  return undefined;
}

/**
 * Bir haber sayfasını indirip başlık, görsel, tarih ve gövdeyi çıkarır.
 * Önce site meta verilerine (og:, JSON-LD) bakar; gövde için Readability kullanır.
 */
export async function extractArticle(url: string): Promise<ExtractedArticle | null> {
  const res = await fetchText(url);
  if (!res.ok || res.body.length < 500) return null;

  const html = res.body;
  const finalUrl = res.url || url;
  const $ = cheerio.load(html);

  const meta = (selector: string) => {
    const value = $(selector).attr("content");
    return value ? decodeEntities(value.trim()) : undefined;
  };

  const ld = findNewsArticleLd($);

  const title =
    meta('meta[property="og:title"]') ??
    (ld ? firstString(ld.headline) : undefined) ??
    $("h1").first().text().trim() ??
    undefined;

  const description =
    meta('meta[property="og:description"]') ??
    meta('meta[name="description"]') ??
    (ld ? firstString(ld.description) : undefined);

  const imageUrl =
    meta('meta[property="og:image"]') ??
    meta('meta[name="twitter:image"]') ??
    (ld ? firstString(ld.image) : undefined);

  const publishedAt =
    parseDate(meta('meta[property="article:published_time"]')) ??
    parseDate(ld?.datePublished) ??
    parseDate($("time[datetime]").first().attr("datetime")) ??
    parseDate(meta('meta[itemprop="datePublished"]'));

  const author =
    (ld ? firstString(ld.author) : undefined) ??
    meta('meta[name="author"]') ??
    meta('meta[property="article:author"]');

  const sectionHint =
    meta('meta[property="article:section"]') ??
    (ld ? firstString(ld.articleSection) : undefined);

  // --- Gövde ---------------------------------------------------------
  let bodyHtml = "";

  // 1) JSON-LD articleBody genelde en temiz kaynak
  const articleBody = typeof ld?.articleBody === "string" ? ld.articleBody.trim() : "";
  if (articleBody.length > 400 && !articleBody.includes("<")) {
    bodyHtml = articleBody
      .split(/\n{1,}/)
      .map((paragraph) => paragraph.trim())
      .filter(Boolean)
      .map((paragraph) => `<p>${paragraph}</p>`)
      .join("");
  }

  // 2) Readability
  if (bodyHtml.length < 400) {
    const virtualConsole = new VirtualConsole();
    virtualConsole.on("error", () => {});
    virtualConsole.on("jsdomError", () => {});
    try {
      const dom = new JSDOM(html, { url: finalUrl, virtualConsole });
      const article = new Readability(dom.window.document, {
        charThreshold: 200,
      }).parse();
      if (article?.content && article.content.length > bodyHtml.length) {
        bodyHtml = article.content;
      }
      dom.window.close();
    } catch {
      // Readability başarısız olursa aşağıdaki seçici tabanlı yönteme düşeriz
    }
  }

  // 3) Yaygın haber gövdesi seçicileri
  if (bodyHtml.length < 400) {
    const selectors = [
      "article .content",
      "div.haber-detay",
      "div.news-content",
      "div.article-body",
      "div.entry-content",
      "div#newsText",
      "div.detay-icerik",
      "div[itemprop='articleBody']",
      "article",
    ];
    for (const selector of selectors) {
      const candidate = $(selector).first().html();
      if (candidate && candidate.length > bodyHtml.length) {
        bodyHtml = candidate;
        if (bodyHtml.length > 800) break;
      }
    }
  }

  const cleaned = cleanArticleHtml(bodyHtml, finalUrl);

  return {
    title: title ? decodeEntities(title).replace(/\s+/g, " ").trim() : undefined,
    contentHtml: cleaned.html,
    imageUrl: imageUrl ?? cleaned.images[0],
    publishedAt,
    author: author?.replace(/\s+/g, " ").trim(),
    description: description?.replace(/\s+/g, " ").trim(),
    sectionHint,
  };
}

/** Liste/kategori sayfasından haber bağlantılarını toplar (RSS'i olmayan kaynaklar için). */
export async function collectArticleLinks(
  listUrl: string,
  pattern: RegExp,
  limit = 40
): Promise<string[]> {
  const res = await fetchText(listUrl);
  if (!res.ok) throw new Error(`${listUrl}: HTTP ${res.status}${res.error ? ` (${res.error})` : ""}`);

  const $ = cheerio.load(res.body);
  const base = res.url || listUrl;
  const found = new Set<string>();

  $("a[href]").each((_, el) => {
    if (found.size >= limit) return false;
    const href = $(el).attr("href");
    if (!href) return;
    let absolute: string;
    try {
      absolute = new URL(href, base).toString().split("#")[0];
    } catch {
      return;
    }
    if (pattern.test(absolute)) found.add(absolute);
  });

  return [...found];
}
