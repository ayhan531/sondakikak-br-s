import "dotenv/config";
import { runAllSources } from "@/lib/scraper";

/**
 * Haberleri komut satırından çeker.
 *   npm run fetch:news              -> tüm aktif kaynaklar
 *   npm run fetch:news -- bagimsiz  -> tek kaynak
 */
const sourceSlug = process.argv[2];

runAllSources(sourceSlug ? { sourceSlug } : {})
  .then((summary) => {
    console.log("\n─────────────────────────────────────────────");
    for (const detail of summary.details) {
      const status = detail.error ? `HATA: ${detail.error}` : "";
      console.log(
        `${detail.sourceName.padEnd(22)} bulundu:${String(detail.found).padStart(3)}  ` +
          `eklendi:${String(detail.created).padStart(3)}  atlandı:${String(detail.skipped).padStart(3)}  ` +
          `hata:${String(detail.failed).padStart(2)}  ${(detail.durationMs / 1000).toFixed(1)}sn ${status}`
      );
    }
    console.log("─────────────────────────────────────────────");
    console.log(
      `TOPLAM  ${summary.created} yeni haber eklendi, ${summary.skipped} atlandı, ${summary.failed} hata`
    );
    process.exit(0);
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
