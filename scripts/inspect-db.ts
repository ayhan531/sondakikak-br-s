import "dotenv/config";
import { prisma } from "@/lib/prisma";

async function main() {
  const total = await prisma.article.count();
  const withImage = await prisma.article.count({ where: { imageLocal: { not: null } } });
  console.log(`Toplam haber: ${total} | yerel görselli: ${withImage}`);

  const byCategory = await prisma.article.groupBy({
    by: ["categoryId"],
    _count: true,
  });
  const categories = await prisma.category.findMany();
  for (const row of byCategory) {
    const name = categories.find((c) => c.id === row.categoryId)?.name ?? "(kategorisiz)";
    console.log(`  ${name.padEnd(16)} ${row._count}`);
  }

  const samples = await prisma.article.findMany({
    take: 4,
    orderBy: { createdAt: "desc" },
    include: { category: true, tags: { include: { tag: true } } },
  });

  for (const article of samples) {
    console.log("\n══════════════════════════════════════════");
    console.log("BAŞLIK   :", article.title);
    console.log("SLUG     :", article.slug);
    console.log("KATEGORİ :", article.category?.name, "| KAYNAK:", article.sourceName);
    console.log("TARİH    :", article.publishedAt.toISOString(), "| okuma:", article.readingTime, "dk");
    console.log("GÖRSEL   :", article.imageLocal ?? "YOK", "| uzak:", article.imageUrl?.slice(0, 70));
    console.log("ETİKET   :", article.tags.map((t) => t.tag.name).join(", "));
    console.log("ÖZET     :", article.summary);
    console.log("META DESC:", article.metaDescription);
    console.log("İÇERİK   :", article.content.length, "karakter");
    console.log(article.content.slice(0, 500));
  }
  await prisma.$disconnect();
}

main();
