import "dotenv/config";
import { prisma } from "@/lib/prisma";
import { cleanArticleHtml, removeDuplicateLead, stripByline } from "@/lib/scraper/clean";
import { matchCategory } from "@/lib/categories";
import { htmlToText, makeExcerpt, readingTime, searchNormalize } from "@/lib/text";

/**
 * Kayıtlı haberleri güncel temizleyici ve kategori kurallarından tekrar geçirir.
 * Kuralları iyileştirdikten sonra yeniden çekmeye gerek kalmaz.
 */
async function main() {
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
      console.log(`  ⚠ çok kısaldı, atlandı: ${article.title.slice(0, 60)}`);
      continue;
    }

    // Kategoriyi güncel kurallarla yeniden hesapla
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

  console.log(
    `\n${articles.length} haber tarandı — ${contentChanged} içerik, ${categoryChanged} kategori güncellendi, ${skipped} atlandı.`
  );
  await prisma.$disconnect();
}

main();
