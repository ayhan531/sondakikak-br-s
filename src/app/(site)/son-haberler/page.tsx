import type { Metadata } from "next";
import { ArticleCard } from "@/components/ArticleCard";
import { AdSlot } from "@/components/ads/AdSlot";
import { Pagination } from "@/components/Pagination";
import { countArticles, getLatest } from "@/lib/queries";
import { getSettings } from "@/lib/settings";

export const revalidate = 60;

const PER_PAGE = 30;

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSettings();
  return {
    title: "Son Dakika Haberleri",
    description: `Kıbrıs ve KKTC'den dakika dakika son haberler. ${settings.siteName} ile gündemi kaçırmayın.`,
    alternates: { canonical: `${settings.siteUrl}/son-haberler` },
  };
}

export default async function LatestPage({
  searchParams,
}: {
  searchParams: Promise<{ sayfa?: string }>;
}) {
  const { sayfa } = await searchParams;
  const page = Math.max(1, Number(sayfa) || 1);

  const [articles, total] = await Promise.all([
    getLatest({ take: PER_PAGE, skip: (page - 1) * PER_PAGE }),
    countArticles(),
  ]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-5">
      <AdSlot placement="under-header" className="mb-5" />

      <header className="mb-6">
        <h1 className="flex items-center gap-3 text-2xl font-black text-ink-900 sm:text-3xl">
          <span className="h-8 w-1.5 rounded-full bg-brand-600" />
          Son Dakika Haberleri
        </h1>
        <p className="mt-1 text-xs text-ink-500">{total} haber</p>
      </header>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {articles.map((article, index) => (
          <ArticleCard
            key={article.id}
            article={article}
            variant="medium"
            priority={index < 3}
          />
        ))}
      </div>

      <Pagination
        page={page}
        totalPages={Math.ceil(total / PER_PAGE)}
        basePath="/son-haberler"
      />

      <AdSlot placement="footer" className="mt-10" />
    </div>
  );
}
