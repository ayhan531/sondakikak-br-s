import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSettings } from "@/lib/settings";
import { xmlEscape, xmlResponse } from "@/lib/xml";
import { ARTICLES_PER_SITEMAP } from "@/app/sitemap.xml/route";

export const revalidate = 3600;

type Entry = {
  loc: string;
  lastmod?: string;
  changefreq?: string;
  priority?: string;
  image?: string | null;
};

function buildUrlset(entries: Entry[]): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:image="http://schemas.google.com/schemas/sitemap-image/1.1">
${entries
  .map(
    (entry) => `  <url>
    <loc>${xmlEscape(entry.loc)}</loc>${entry.lastmod ? `\n    <lastmod>${entry.lastmod}</lastmod>` : ""}${
      entry.changefreq ? `\n    <changefreq>${entry.changefreq}</changefreq>` : ""
    }${entry.priority ? `\n    <priority>${entry.priority}</priority>` : ""}${
      entry.image ? `\n    <image:image><image:loc>${xmlEscape(entry.image)}</image:loc></image:image>` : ""
    }
  </url>`
  )
  .join("\n")}
</urlset>`;
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ file: string }> }
) {
  const { file } = await params;
  const settings = await getSettings();
  const base = settings.siteUrl.replace(/\/$/, "");
  const name = file.replace(/\.xml$/, "");

  // --- Sabit sayfalar --------------------------------------------------
  if (name === "sayfalar") {
    const entries: Entry[] = [
      { loc: `${base}/`, changefreq: "hourly", priority: "1.0" },
      { loc: `${base}/son-haberler`, changefreq: "hourly", priority: "0.9" },
      { loc: `${base}/kunye`, changefreq: "yearly", priority: "0.3" },
      { loc: `${base}/iletisim`, changefreq: "yearly", priority: "0.3" },
      { loc: `${base}/gizlilik`, changefreq: "yearly", priority: "0.2" },
      { loc: `${base}/reklam`, changefreq: "monthly", priority: "0.4" },
    ];
    return xmlResponse(buildUrlset(entries));
  }

  // --- Kategoriler -----------------------------------------------------
  if (name === "kategoriler") {
    const categories = await prisma.category.findMany({
      where: { isActive: true },
      select: { slug: true, updatedAt: true },
    });
    return xmlResponse(
      buildUrlset(
        categories.map((category) => ({
          loc: `${base}/kategori/${category.slug}`,
          lastmod: category.updatedAt.toISOString(),
          changefreq: "hourly",
          priority: "0.8",
        }))
      )
    );
  }

  // --- Etiketler -------------------------------------------------------
  if (name === "etiketler") {
    const tags = await prisma.tag.findMany({
      select: { slug: true },
      orderBy: { createdAt: "desc" },
      take: 5000,
    });
    return xmlResponse(
      buildUrlset(
        tags.map((tag) => ({
          loc: `${base}/etiket/${tag.slug}`,
          changefreq: "weekly",
          priority: "0.5",
        }))
      )
    );
  }

  // --- Haberler (parçalı) ----------------------------------------------
  const chunkMatch = /^haberler-(\d+)$/.exec(name);
  if (chunkMatch) {
    const chunk = Number(chunkMatch[1]);
    if (chunk < 1) notFound();

    const articles = await prisma.article.findMany({
      where: { status: "published" },
      orderBy: { publishedAt: "desc" },
      skip: (chunk - 1) * ARTICLES_PER_SITEMAP,
      take: ARTICLES_PER_SITEMAP,
      select: { slug: true, updatedAt: true, imageLocal: true, imageUrl: true },
    });

    if (articles.length === 0) notFound();

    return xmlResponse(
      buildUrlset(
        articles.map((article) => ({
          loc: `${base}/haber/${article.slug}`,
          lastmod: article.updatedAt.toISOString(),
          changefreq: "daily",
          priority: "0.7",
          image: article.imageLocal ? `${base}${article.imageLocal}` : article.imageUrl,
        }))
      )
    );
  }

  notFound();
}
