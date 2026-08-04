import "dotenv/config";
import { prisma } from "@/lib/prisma";

/** Kategori SEO başlıklarında tekrar eden site adını temizler. */
async function main() {
  const categories = await prisma.category.findMany();
  let fixed = 0;

  for (const category of categories) {
    const cleaned = (category.metaTitle ?? "")
      .replace(/\s*[-–|]\s*Son Dakika Kıbrıs\s*$/i, "")
      .trim();

    if (cleaned && cleaned !== category.metaTitle) {
      await prisma.category.update({
        where: { id: category.id },
        data: { metaTitle: cleaned },
      });
      fixed++;
    }
  }

  console.log(`${fixed} kategori başlığı düzeltildi.`);
  await prisma.$disconnect();
}

main();
