import { prisma } from "@/lib/prisma";
import { getSettings } from "@/lib/settings";
import { xmlEscape, xmlResponse } from "@/lib/xml";

export const revalidate = 300;

/**
 * Google News site haritası: yalnızca son 48 saatin haberlerini içerir
 * (Google News şartı) ve en fazla 1000 kayıt.
 */
export async function GET() {
  const settings = await getSettings();
  const base = settings.siteUrl.replace(/\/$/, "");
  const since = new Date(Date.now() - 48 * 60 * 60 * 1000);

  const articles = await prisma.article.findMany({
    where: { status: "published", publishedAt: { gte: since } },
    orderBy: { publishedAt: "desc" },
    take: 1000,
    select: {
      slug: true,
      title: true,
      publishedAt: true,
      keywords: true,
      imageLocal: true,
      imageUrl: true,
    },
  });

  const body = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:news="http://www.google.com/schemas/sitemap-news/0.9"
        xmlns:image="http://schemas.google.com/schemas/sitemap-image/1.1">
${articles
  .map((article) => {
    const image = article.imageLocal ? `${base}${article.imageLocal}` : article.imageUrl;
    return `  <url>
    <loc>${xmlEscape(`${base}/haber/${article.slug}`)}</loc>
    <news:news>
      <news:publication>
        <news:name>${xmlEscape(settings.siteName)}</news:name>
        <news:language>tr</news:language>
      </news:publication>
      <news:publication_date>${article.publishedAt.toISOString()}</news:publication_date>
      <news:title>${xmlEscape(article.title)}</news:title>${
        article.keywords
          ? `\n      <news:keywords>${xmlEscape(article.keywords)}</news:keywords>`
          : ""
      }
    </news:news>${
      image
        ? `\n    <image:image><image:loc>${xmlEscape(image)}</image:loc></image:image>`
        : ""
    }
  </url>`;
  })
  .join("\n")}
</urlset>`;

  return xmlResponse(body, 300);
}
