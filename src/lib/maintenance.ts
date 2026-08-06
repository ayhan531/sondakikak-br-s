import { prisma } from "@/lib/prisma";
import { cleanArticleHtml, removeDuplicateLead, stripByline } from "@/lib/scraper/clean";
import { ingestImage } from "@/lib/scraper/image";
import { matchCategory } from "@/lib/categories";
import { htmlToText, makeExcerpt, readingTime, searchNormalize } from "@/lib/text";

/**
 * Kayıtlı haberleri güncel temizleyici ve kategori kurallarından tekrar geçirir.
 * Temizleme kurallarını iyileştirdikten sonra yeniden çekmeye gerek kalmaz.
 */
export async function recleanArticles() {
  const [articles, categories] = await Promise.all([
    prisma.article.findMany({
      include: { source: { select: { defaultCategorySlug: true } } },
    }),
    prisma.category.findMany({ select: { id: true, slug: true } }),
  ]);

  let contentChanged = 0;
  let categoryChanged = 0;
  let skipped = 0;

  for (const article of articles) {
    const base = article.sourceUrl ?? "https://sondakikakibris.com";

    let content = cleanArticleHtml(article.content, base).html;
    content = removeDuplicateLead(content, {
      description: article.summary,
      heroImage: article.imageUrl ?? undefined,
      // Özet gövdeden türetilmiş olabilir; yalnızca spot başlıklarını sil
      headingOnly: true,
    });

    const byline = stripByline(content);
    content = byline.html;
    const plain = htmlToText(content);

    if (plain.length < 150) {
      skipped++;
      continue;
    }

    const slug = matchCategory([article.title], article.source?.defaultCategorySlug ?? "kibris");
    const categoryId = categories.find((c) => c.slug === slug)?.id ?? article.categoryId;

    const contentDiffers = content !== article.content;
    const categoryDiffers = categoryId !== article.categoryId;
    if (!contentDiffers && !categoryDiffers) continue;

    await prisma.article.update({
      where: { id: article.id },
      data: {
        ...(contentDiffers
          ? {
              content,
              summary: makeExcerpt(plain, 220),
              metaDescription: makeExcerpt(plain, 155),
              searchText: searchNormalize(`${article.title} ${plain.slice(0, 4000)}`),
              readingTime: readingTime(plain),
              author: article.author ?? byline.author ?? null,
            }
          : {}),
        ...(categoryDiffers ? { categoryId } : {}),
      },
    });

    if (contentDiffers) contentChanged++;
    if (categoryDiffers) categoryChanged++;
  }

  return { scanned: articles.length, contentChanged, categoryChanged, skipped };
}

/**
 * Eski kirli içerikten türetilmiş işe yaramaz etiketleri siler
 * (kaynak sitelerin tepki/paylaşım widget kelimeleri).
 */
export async function cleanupJunkTags() {
  const junkSlugs = [
    "mutlu", "alkis", "uzgun", "sasirmis", "saskin", "kizgin", "sinirli",
    "korkmus", "komik", "yorum", "yorumlar", "begen", "paylas", "tepki",
    "tepkiler", "whatsapp", "facebook", "twitter", "telegram", "instagram",
    "linkedin", "pinterest", "eposta", "e-posta", "yazdir", "abone",
  ];

  const result = await prisma.tag.deleteMany({
    where: { slug: { in: junkSlugs } },
  });

  return { deleted: result.count };
}

/**
 * Yerel kopyası alınamamış haber görsellerini (hotlink koruması vb. yüzünden)
 * Referer başlığıyla yeniden indirmeyi dener.
 */
export async function repairMissingImages(limit = 60) {
  const articles = await prisma.article.findMany({
    where: { imageLocal: null, imageUrl: { not: null } },
    select: { id: true, imageUrl: true, sourceUrl: true },
    orderBy: { publishedAt: "desc" },
    take: limit,
  });

  let repaired = 0;
  let failed = 0;

  for (const article of articles) {
    const local = await ingestImage(article.imageUrl!, article.sourceUrl ?? undefined);
    if (local) {
      await prisma.article.update({
        where: { id: article.id },
        data: { imageLocal: local },
      });
      repaired++;
    } else {
      // Çekim sırasında ve burada da indirilemedi: uzak adres ölü/korumalı.
      // Kırık görsel ikonu yerine yer tutucu gösterilsin diye adresi temizliyoruz.
      await prisma.article.update({
        where: { id: article.id },
        data: { imageUrl: null },
      });
      failed++;
    }
  }

  return { candidates: articles.length, repaired, failed };
}
