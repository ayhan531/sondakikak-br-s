import "dotenv/config";
import { prisma } from "@/lib/prisma";
import { recleanArticles } from "@/lib/maintenance";

/**
 * Kayıtlı haberleri güncel temizleyici ve kategori kurallarından tekrar geçirir.
 * Aynı işlem canlıda /api/cron/bakim?islem=reclean ucuyla da tetiklenebilir.
 */
async function main() {
  const result = await recleanArticles();
  console.log(
    `${result.scanned} haber tarandı — ${result.contentChanged} içerik, ${result.categoryChanged} kategori güncellendi, ${result.skipped} atlandı.`
  );
  await prisma.$disconnect();
}

main();
