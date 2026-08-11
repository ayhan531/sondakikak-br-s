import { prisma } from "@/lib/prisma";
import { getSettings } from "@/lib/settings";
import { xmlEscape, xmlResponse } from "@/lib/xml";

// Statik ISR, build anındaki boş geçici veritabanıyla üretilip deploy sonrası
// birkaç dakika stale kalıyordu; her istekte canlı veriden üretiyoruz.
export const dynamic = "force-dynamic";

/** Haber sayfaları bu boyutta parçalara bölünür (Google sınırı 50.000). */
export const ARTICLES_PER_SITEMAP = 5000;

/** Site haritası dizini: alt haritaları listeler. */
export async function GET() {
  const settings = await getSettings();
  const base = settings.siteUrl.replace(/\/$/, "");

  const articleCount = await prisma.article.count({ where: { status: "published" } });
  const chunks = Math.max(1, Math.ceil(articleCount / ARTICLES_PER_SITEMAP));

  const newest = await prisma.article.findFirst({
    where: { status: "published" },
    orderBy: { updatedAt: "desc" },
    select: { updatedAt: true },
  });
  const lastmod = (newest?.updatedAt ?? new Date()).toISOString();

  const entries = [
    `${base}/sitemaps/sayfalar.xml`,
    `${base}/sitemaps/kategoriler.xml`,
    `${base}/sitemaps/etiketler.xml`,
    `${base}/news-sitemap.xml`,
    ...Array.from({ length: chunks }, (_, i) => `${base}/sitemaps/haberler-${i + 1}.xml`),
  ];

  const body = `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${entries
  .map(
    (loc) => `  <sitemap>
    <loc>${xmlEscape(loc)}</loc>
    <lastmod>${lastmod}</lastmod>
  </sitemap>`
  )
  .join("\n")}
</sitemapindex>`;

  return xmlResponse(body);
}
