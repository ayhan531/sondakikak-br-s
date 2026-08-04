import "dotenv/config";
import { prisma } from "@/lib/prisma";
import { extractKeywords, htmlToText, slugify } from "@/lib/text";

/** Etiket çıkarımı iyileştirildikten sonra mevcut haberlerin etiketlerini yeniler. */
async function main() {
  const articles = await prisma.article.findMany({
    select: { id: true, title: true, content: true },
  });

  for (const article of articles) {
    const keywords = extractKeywords(`${article.title} ${htmlToText(article.content)}`, 8);

    await prisma.articleTag.deleteMany({ where: { articleId: article.id } });
    await prisma.article.update({
      where: { id: article.id },
      data: { keywords: keywords.join(", ") },
    });

    for (const name of keywords.slice(0, 5)) {
      const slug = slugify(name, 40);
      if (!slug || slug.length < 3) continue;
      const tag = await prisma.tag.upsert({ where: { slug }, create: { slug, name }, update: {} });
      await prisma.articleTag.upsert({
        where: { articleId_tagId: { articleId: article.id, tagId: tag.id } },
        create: { articleId: article.id, tagId: tag.id },
        update: {},
      });
    }
  }

  // Hiçbir habere bağlı kalmayan etiketleri temizle
  const orphans = await prisma.tag.findMany({
    where: { articles: { none: {} } },
    select: { id: true },
  });
  await prisma.tag.deleteMany({ where: { id: { in: orphans.map((tag) => tag.id) } } });

  const sample = await prisma.article.findMany({
    take: 5,
    orderBy: { publishedAt: "desc" },
    select: { title: true, keywords: true },
  });

  console.log(`${articles.length} haberin etiketleri yenilendi, ${orphans.length} boş etiket silindi.\n`);
  for (const row of sample) {
    console.log(`${row.title.slice(0, 55)}\n   → ${row.keywords}\n`);
  }

  await prisma.$disconnect();
}

main();
