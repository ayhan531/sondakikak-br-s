import { prisma } from "@/lib/prisma";
import { getSettings } from "@/lib/settings";
import { xmlEscape, xmlResponse } from "@/lib/xml";

export const revalidate = 600;

/** Sitenin kendi RSS beslemesi. */
export async function GET() {
  const settings = await getSettings();
  const base = settings.siteUrl.replace(/\/$/, "");

  const articles = await prisma.article.findMany({
    where: { status: "published" },
    orderBy: { publishedAt: "desc" },
    take: 50,
    select: {
      slug: true,
      title: true,
      summary: true,
      publishedAt: true,
      imageLocal: true,
      imageUrl: true,
      category: { select: { name: true } },
    },
  });

  const body = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:media="http://search.yahoo.com/mrss/">
  <channel>
    <title>${xmlEscape(settings.siteName)}</title>
    <link>${xmlEscape(base)}</link>
    <description>${xmlEscape(settings.siteDescription)}</description>
    <language>tr</language>
    <lastBuildDate>${(articles[0]?.publishedAt ?? new Date()).toUTCString()}</lastBuildDate>
    <atom:link href="${xmlEscape(`${base}/rss.xml`)}" rel="self" type="application/rss+xml" />
${articles
  .map((article) => {
    const link = `${base}/haber/${article.slug}`;
    const image = article.imageLocal ? `${base}${article.imageLocal}` : article.imageUrl;
    return `    <item>
      <title>${xmlEscape(article.title)}</title>
      <link>${xmlEscape(link)}</link>
      <guid isPermaLink="true">${xmlEscape(link)}</guid>
      <description>${xmlEscape(article.summary)}</description>
      <pubDate>${article.publishedAt.toUTCString()}</pubDate>${
        article.category ? `\n      <category>${xmlEscape(article.category.name)}</category>` : ""
      }${image ? `\n      <media:content url="${xmlEscape(image)}" medium="image" />` : ""}
    </item>`;
  })
  .join("\n")}
  </channel>
</rss>`;

  return xmlResponse(body, 600);
}
