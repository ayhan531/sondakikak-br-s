import { prisma } from "@/lib/prisma";
import { matchCategory } from "@/lib/categories";
import {
  htmlToText,
  makeExcerpt,
  readingTime,
  searchNormalize,
  slugify,
  extractKeywords,
} from "@/lib/text";
import { parseFeed, type FeedItem } from "./feed";
import { collectArticleLinks, extractArticle } from "./extract";
import { cleanArticleHtml, removeDuplicateLead, stripByline } from "./clean";
import { ingestImage } from "./image";
import { sleep } from "./http";

export type SourceRunResult = {
  sourceSlug: string;
  sourceName: string;
  found: number;
  created: number;
  skipped: number;
  failed: number;
  durationMs: number;
  error?: string;
};

/** İçerik bu uzunluğun altındaysa haber sayfasına gidip tam metni çıkarırız. */
const MIN_BODY_LENGTH = 600;
/** Kaynak sunucuya nazik davranmak için haberler arası bekleme. */
const POLITE_DELAY_MS = 350;

// ---------------------------------------------------------------- yardımcılar

/** Aynı haberin farklı kaynaklardan tekrar yayınlanmasını engellemek için başlık anahtarı. */
function titleWords(title: string): Set<string> {
  return new Set(
    searchNormalize(title)
      .replace(/[^a-z0-9 ]/g, " ")
      .split(/\s+/)
      .filter((word) => word.length > 3)
  );
}

function similarity(a: Set<string>, b: Set<string>): number {
  if (!a.size || !b.size) return 0;
  let shared = 0;
  for (const word of a) if (b.has(word)) shared++;
  return shared / Math.min(a.size, b.size);
}

async function uniqueSlug(base: string): Promise<string> {
  const slug = slugify(base);
  const existing = await prisma.article.findUnique({ where: { slug }, select: { id: true } });
  if (!existing) return slug;

  for (let suffix = 2; suffix < 60; suffix++) {
    const candidate = `${slug}-${suffix}`;
    const taken = await prisma.article.findUnique({
      where: { slug: candidate },
      select: { id: true },
    });
    if (!taken) return candidate;
  }
  return `${slug}-${Date.now().toString(36)}`;
}

async function attachTags(articleId: string, names: string[]) {
  for (const name of names) {
    const slug = slugify(name, 40);
    if (!slug || slug.length < 3) continue;
    try {
      const tag = await prisma.tag.upsert({
        where: { slug },
        create: { slug, name },
        update: {},
      });
      await prisma.articleTag.upsert({
        where: { articleId_tagId: { articleId, tagId: tag.id } },
        create: { articleId, tagId: tag.id },
        update: {},
      });
    } catch {
      // Etiket eklenemezse haberi kaybetmeye değmez
    }
  }
}

// ---------------------------------------------------------------- tek kaynak

type SourceRecord = Awaited<ReturnType<typeof prisma.source.findMany>>[number];

/** Bir kaynağın son haberlerini çeker ve veritabanına ekler. */
export async function runSource(source: SourceRecord): Promise<SourceRunResult> {
  const startedAt = Date.now();
  const result: SourceRunResult = {
    sourceSlug: source.slug,
    sourceName: source.name,
    found: 0,
    created: 0,
    skipped: 0,
    failed: 0,
    durationMs: 0,
  };

  try {
    // 1) Aday haberleri topla
    let candidates: FeedItem[] = [];

    if (source.mode === "rss" && source.feedUrl) {
      candidates = await parseFeed(source.feedUrl);
    } else if (source.mode === "crawl") {
      const urls: string[] = JSON.parse(source.crawlUrls || "[]");
      const pattern = new RegExp(source.linkPattern || ".", "i");
      const seen = new Set<string>();
      for (const listUrl of urls) {
        try {
          const links = await collectArticleLinks(listUrl, pattern, 25);
          for (const link of links) {
            if (seen.has(link)) continue;
            seen.add(link);
            candidates.push({
              title: "",
              link,
              publishedAt: null,
              summaryHtml: "",
              contentHtml: "",
              categories: [],
            });
          }
        } catch {
          result.failed++;
        }
        await sleep(POLITE_DELAY_MS);
      }
    } else {
      throw new Error("Kaynak için besleme adresi tanımlı değil");
    }

    result.found = candidates.length;

    // 2) Zaten kayıtlı olanları ele
    const links = candidates.map((item) => item.link);
    const existing = await prisma.article.findMany({
      where: { sourceUrl: { in: links } },
      select: { sourceUrl: true },
    });
    const known = new Set(existing.map((row) => row.sourceUrl));

    const fresh = candidates.filter((item) => !known.has(item.link)).slice(0, source.maxPerRun);
    result.skipped = candidates.length - fresh.length;

    // 3) Son 3 günün başlıkları (kaynaklar arası tekrar kontrolü için)
    const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);
    const recent = await prisma.article.findMany({
      where: { publishedAt: { gte: threeDaysAgo } },
      select: { title: true },
      take: 600,
    });
    const recentTitleSets = recent.map((row) => titleWords(row.title));

    // 4) Her haberi işle
    for (const item of fresh) {
      try {
        const created = await ingestItem(source, item, recentTitleSets);
        if (created === "created") result.created++;
        else result.skipped++;
      } catch {
        result.failed++;
      }
      await sleep(POLITE_DELAY_MS);
    }

    await prisma.source.update({
      where: { id: source.id },
      data: {
        lastFetchedAt: new Date(),
        lastError: null,
        fetchCount: { increment: 1 },
        articleCount: { increment: result.created },
      },
    });
  } catch (error) {
    result.error = error instanceof Error ? error.message : String(error);
    await prisma.source.update({
      where: { id: source.id },
      data: { lastFetchedAt: new Date(), lastError: result.error.slice(0, 500) },
    });
  }

  result.durationMs = Date.now() - startedAt;

  await prisma.fetchLog.create({
    data: {
      sourceId: source.id,
      found: result.found,
      created: result.created,
      skipped: result.skipped,
      failed: result.failed,
      durationMs: result.durationMs,
      error: result.error?.slice(0, 500) ?? null,
    },
  });

  return result;
}

/** Tek bir haberi normalize edip kaydeder. */
async function ingestItem(
  source: SourceRecord,
  item: FeedItem,
  recentTitleSets: Set<string>[]
): Promise<"created" | "skipped"> {
  let title = item.title;
  let contentHtml = item.contentHtml
    ? cleanArticleHtml(item.contentHtml, item.link).html
    : "";
  let imageUrl = item.imageUrl;
  let publishedAt = item.publishedAt;
  let author = item.author;
  let description = "";
  let sectionHint: string | undefined;

  // Besleme yetersizse haber sayfasına git
  if (!title || contentHtml.length < MIN_BODY_LENGTH) {
    const page = await extractArticle(item.link);
    if (page) {
      title = title || page.title || "";
      if (page.contentHtml.length > contentHtml.length) contentHtml = page.contentHtml;
      imageUrl = imageUrl || page.imageUrl;
      publishedAt = publishedAt || page.publishedAt || null;
      author = author || page.author;
      description = page.description ?? "";
      sectionHint = page.sectionHint;
    }
  }

  title = (title || "").replace(/\s+/g, " ").trim();

  // Spot cümlesi ve kapak görseli gövdede tekrar etmesin
  contentHtml = removeDuplicateLead(contentHtml, {
    description,
    heroImage: imageUrl,
  });

  const byline = stripByline(contentHtml);
  contentHtml = byline.html;
  author = author || byline.author;

  const plain = htmlToText(contentHtml);

  // Kalite eşiği: başlıksız veya çok kısa içerikleri almıyoruz
  if (title.length < 12 || plain.length < 220) return "skipped";

  // Kaynaklar arası tekrar kontrolü
  const words = titleWords(title);
  if (recentTitleSets.some((existing) => similarity(words, existing) >= 0.75)) {
    return "skipped";
  }
  recentTitleSets.push(words);

  const summary = makeExcerpt(description || plain, 220);
  const categorySlug = matchCategory(
    [...item.categories, sectionHint, title],
    source.defaultCategorySlug
  );
  const category = await prisma.category.findUnique({ where: { slug: categorySlug } });

  const localImage = imageUrl ? await ingestImage(imageUrl) : null;
  const slug = await uniqueSlug(title);
  const keywords = extractKeywords(`${title} ${plain}`, 8);

  const article = await prisma.article.create({
    data: {
      slug,
      title,
      summary,
      content: contentHtml,
      searchText: searchNormalize(`${title} ${summary} ${plain.slice(0, 4000)}`),
      imageUrl: imageUrl ?? null,
      imageLocal: localImage,
      imageAlt: title,
      categoryId: category?.id ?? null,
      sourceId: source.id,
      sourceUrl: item.link,
      sourceName: source.name,
      author: author ?? null,
      status: source.autoPublish ? "published" : "draft",
      publishedAt: publishedAt ?? new Date(),
      readingTime: readingTime(plain),
      metaTitle: title.length > 60 ? `${title.slice(0, 57)}...` : title,
      metaDescription: makeExcerpt(description || plain, 155),
      keywords: keywords.join(", "),
    },
  });

  await attachTags(article.id, keywords.slice(0, 5));

  return "created";
}

// ---------------------------------------------------------------- tüm kaynaklar

/** Aktif tüm kaynakları sırayla çeker. */
export async function runAllSources(options: { sourceSlug?: string } = {}) {
  const sources = await prisma.source.findMany({
    where: {
      isActive: true,
      ...(options.sourceSlug ? { slug: options.sourceSlug } : {}),
    },
    orderBy: { priority: "desc" },
  });

  const results: SourceRunResult[] = [];
  for (const source of sources) {
    results.push(await runSource(source));
  }

  return {
    startedAt: new Date().toISOString(),
    sources: results.length,
    created: results.reduce((total, r) => total + r.created, 0),
    skipped: results.reduce((total, r) => total + r.skipped, 0),
    failed: results.reduce((total, r) => total + r.failed, 0),
    details: results,
  };
}
