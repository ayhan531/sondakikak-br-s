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
 * Gerçek görseli olmayan TÜM haberlere görsel bulur. Sıra:
 * 1) kayıtlı kapak adresi  2) kaynak haber sayfasını yeniden ziyaret edip
 * og:image / gövde görselini çıkar  3) gövdedeki görsel adresleri.
 * Markalı kategori kapağı yalnızca kaynakta hiç görsel yoksa son çaredir.
 */
export async function repairMissingImages(limit = 200) {
  const articles = await prisma.article.findMany({
    where: {
      OR: [
        { imageLocal: null },
        // Daha önce placeholder atananlar da gerçek görsel için yeniden denenir
        { imageLocal: { startsWith: "/media/placeholder/" } },
      ],
    },
    select: {
      id: true,
      imageUrl: true,
      sourceUrl: true,
      content: true,
      imageLocal: true,
      category: { select: { slug: true, name: true, color: true } },
    },
    orderBy: { publishedAt: "desc" },
    take: limit,
  });

  let repaired = 0;
  let placeholders = 0;
  let failed = 0;

  for (const article of articles) {
    const referer = article.sourceUrl ?? undefined;
    let local: string | null = null;
    let remoteUrl: string | null = null;

    // 1) Kayıtlı kapak adresi
    if (article.imageUrl) {
      local = await ingestImage(article.imageUrl, referer);
      if (local) remoteUrl = article.imageUrl;
    }

    // 2) Kaynak haber sayfasını yeniden ziyaret et: og:image + gövde görselleri
    if (!local && article.sourceUrl) {
      try {
        const { extractArticle } = await import("@/lib/scraper/extract");
        const page = await extractArticle(article.sourceUrl);
        if (page?.imageUrl) {
          local = await ingestImage(page.imageUrl, article.sourceUrl);
          if (local) remoteUrl = page.imageUrl;
        }
      } catch {
        // kaynak site kapalı olabilir; sıradaki adıma geç
      }
    }

    // 3) Kayıtlı gövdedeki görsel adresleri
    if (!local) {
      const bodyImages = [...article.content.matchAll(/<img[^>]+src="(https?:[^"]+)"/gi)]
        .map((match) => match[1])
        .slice(0, 4);
      for (const candidate of bodyImages) {
        local = await ingestImage(candidate, referer);
        if (local) {
          remoteUrl = candidate;
          break;
        }
      }
    }

    if (local) {
      await prisma.article.update({
        where: { id: article.id },
        data: { imageLocal: local, ...(remoteUrl ? { imageUrl: remoteUrl } : {}) },
      });
      repaired++;
    } else if (!article.imageLocal) {
      // Kaynakta gerçekten görsel yok: en azından markalı kapak göster
      const { ensurePlaceholder } = await import("@/lib/scraper/placeholder");
      const placeholder = await ensurePlaceholder(
        article.category?.slug ?? "genel",
        article.category?.name ?? "Haber",
        article.category?.color
      ).catch(() => null);
      if (placeholder) {
        await prisma.article.update({
          where: { id: article.id },
          data: { imageLocal: placeholder },
        });
        placeholders++;
      }
    } else {
      failed++; // placeholder'lı kaldı, kaynakta görsel bulunamadı
    }
  }

  return { candidates: articles.length, repaired, placeholders, failed };
}
