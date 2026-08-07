import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ArticleCard } from "@/components/ArticleCard";
import { AdSlot } from "@/components/ads/AdSlot";
import { Pagination } from "@/components/Pagination";
import { countArticles, getCategoryBySlug, getLatest, getMostRead } from "@/lib/queries";
import { getSettings } from "@/lib/settings";

// Sayfalama searchParams kullandığı için statik üretimle (SSG) çakışıyordu;
// build veritabanı boş olduğundan hiçbir kategori önceden üretilemiyor ve
// çalışma anında DYNAMIC_SERVER_USAGE hatası dönüyordu. Dinamik render ediyoruz.
export const dynamic = "force-dynamic";

const PER_PAGE = 24;

type PageProps = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ sayfa?: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const [category, settings] = await Promise.all([getCategoryBySlug(slug), getSettings()]);
  if (!category) return { title: "Kategori bulunamadı", robots: { index: false } };

  const title = category.metaTitle || `${category.name} Haberleri`;
  const description =
    category.metaDescription ||
    `${category.name} kategorisindeki en güncel Kıbrıs haberleri. ${settings.siteName} ile son dakika gelişmelerini takip edin.`;

  return {
    title,
    description,
    alternates: { canonical: `${settings.siteUrl}/kategori/${category.slug}` },
    openGraph: {
      type: "website",
      locale: "tr_TR",
      title,
      description,
      url: `${settings.siteUrl}/kategori/${category.slug}`,
      siteName: settings.siteName,
    },
  };
}

export default async function CategoryPage({ params, searchParams }: PageProps) {
  const { slug } = await params;
  const { sayfa } = await searchParams;

  const category = await getCategoryBySlug(slug);
  if (!category) notFound();

  const page = Math.max(1, Number(sayfa) || 1);
  const [articles, total, mostRead] = await Promise.all([
    getLatest({ take: PER_PAGE, skip: (page - 1) * PER_PAGE, categorySlug: slug }),
    countArticles(slug),
    getMostRead(6),
  ]);

  const totalPages = Math.ceil(total / PER_PAGE);

  return (
    <div className="mx-auto max-w-7xl px-4 py-5">
      <AdSlot placement="under-header" className="mb-5" />

      <header className="mb-6">
        <h1 className="flex items-center gap-3 text-2xl font-black text-ink-900 sm:text-3xl">
          <span className="h-8 w-1.5 rounded-full" style={{ backgroundColor: category.color }} />
          {category.name}
        </h1>
        {category.description && (
          <p className="mt-2 max-w-3xl text-sm text-ink-600 sm:text-base">{category.description}</p>
        )}
        <p className="mt-1 text-xs text-ink-500">{total} haber</p>
      </header>

      <div className="grid gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2">
          {articles.length === 0 ? (
            <p className="rounded-xl bg-white p-8 text-center text-ink-500 shadow-sm">
              Bu kategoride henüz haber yok.
            </p>
          ) : (
            <>
              <div className="grid gap-4 sm:grid-cols-2">
                {articles.slice(0, 6).map((article, index) => (
                  <ArticleCard
                    key={article.id}
                    article={article}
                    variant="medium"
                    priority={index < 2}
                  />
                ))}
              </div>

              <AdSlot placement="in-feed" className="my-6" />

              <div className="grid gap-4 sm:grid-cols-2">
                {articles.slice(6).map((article) => (
                  <ArticleCard key={article.id} article={article} variant="medium" />
                ))}
              </div>
            </>
          )}

          <Pagination page={page} totalPages={totalPages} basePath={`/kategori/${slug}`} />
        </div>

        <aside className="space-y-6">
          <AdSlot placement="sidebar-top" />
          <section className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-ink-200/70">
            <h2 className="mb-4 border-b-2 border-ink-900 pb-2 text-base font-black uppercase text-ink-900">
              En Çok Okunan
            </h2>
            <div className="space-y-3">
              {mostRead.map((item, index) => (
                <ArticleCard key={item.id} article={item} variant="rank" rank={index + 1} />
              ))}
            </div>
          </section>
          <AdSlot placement="sidebar-mid" />
        </aside>
      </div>
    </div>
  );
}
