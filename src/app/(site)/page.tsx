import Link from "next/link";
import { ArticleCard } from "@/components/ArticleCard";
import { AdSlot } from "@/components/ads/AdSlot";
import { KurlarWidget } from "@/components/widgets/KurlarWidget";
import { HavaWidget } from "@/components/widgets/HavaWidget";
import { EczaneWidget } from "@/components/widgets/EczaneWidget";
import { TrafikWidget } from "@/components/widgets/TrafikWidget";
import {
  getHeadlines,
  getLatest,
  getMostRead,
  getMenuCategories,
} from "@/lib/queries";

// Haber sitesi: içerik sık değişiyor, 60 saniyede bir yeniden üretiliyor
export const revalidate = 60;

function SectionTitle({
  title,
  href,
  color = "#dc2626",
}: {
  title: string;
  href?: string;
  color?: string;
}) {
  return (
    <div className="mb-4 flex items-center justify-between gap-4 border-b-2 border-ink-200 pb-2">
      <h2 className="relative text-lg font-black uppercase tracking-tight text-ink-900 sm:text-xl">
        <span
          className="absolute -bottom-[10px] left-0 h-[3px] w-full"
          style={{ backgroundColor: color }}
        />
        {title}
      </h2>
      {href && (
        <Link
          href={href}
          className="shrink-0 text-xs font-bold uppercase tracking-wide text-ink-500 transition hover:text-brand-600"
        >
          Tümü →
        </Link>
      )}
    </div>
  );
}

export default async function HomePage() {
  const headlines = await getHeadlines(5);
  const headlineIds = headlines.map((article) => article.id);

  const [latest, mostRead, categories] = await Promise.all([
    getLatest({ take: 18, excludeIds: headlineIds }),
    getMostRead(6),
    getMenuCategories(),
  ]);

  const [hero, ...secondary] = headlines;

  // Öne çıkan 4 kategori için ayrı bölümler
  const featuredCategories = categories.slice(0, 4);
  const categoryBlocks = await Promise.all(
    featuredCategories.map(async (category) => ({
      category,
      articles: await getLatest({ take: 4, categorySlug: category.slug }),
    }))
  );

  return (
    <div className="mx-auto max-w-7xl px-4 py-5">
      <AdSlot placement="under-header" className="mb-5" />

      {/* ---------------------------------------------------------- Manşet */}
      {hero && (
        <section aria-label="Manşet" className="mb-8">
          <div className="grid gap-4 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <ArticleCard article={hero} variant="hero" priority />
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
              {secondary.slice(0, 2).map((article) => (
                <ArticleCard key={article.id} article={article} variant="medium" priority />
              ))}
            </div>
          </div>

          {secondary.length > 2 && (
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              {secondary.slice(2).map((article) => (
                <ArticleCard key={article.id} article={article} variant="medium" />
              ))}
            </div>
          )}
        </section>
      )}

      {/* ------------------------------------------------ Akış + sağ sütun */}
      <div className="grid gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <section aria-label="Son haberler">
            <SectionTitle title="Son Haberler" href="/son-haberler" />
            <div className="grid gap-4 sm:grid-cols-2">
              {latest.slice(0, 6).map((article) => (
                <ArticleCard key={article.id} article={article} variant="medium" />
              ))}
            </div>

            <AdSlot placement="in-feed" className="my-6" />

            <div className="grid gap-4 sm:grid-cols-2">
              {latest.slice(6, 12).map((article) => (
                <ArticleCard key={article.id} article={article} variant="medium" />
              ))}
            </div>

            <div className="mt-6 space-y-3 rounded-xl bg-white p-4 shadow-sm ring-1 ring-ink-200/70">
              {latest.slice(12).map((article) => (
                <ArticleCard key={article.id} article={article} variant="row" />
              ))}
            </div>

            <div className="mt-6 text-center">
              <Link
                href="/son-haberler"
                className="inline-block rounded-full bg-ink-900 px-6 py-3 text-sm font-bold text-white transition hover:bg-brand-600"
              >
                Daha Fazla Haber
              </Link>
            </div>
          </section>
        </div>

        {/* Sağ sütun */}
        <aside className="space-y-6">
          <AdSlot placement="sidebar-top" />

          <section
            aria-label="En çok okunanlar"
            className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-ink-200/70"
          >
            <SectionTitle title="En Çok Okunan" color="#0f172a" />
            <div className="space-y-3">
              {mostRead.map((article, index) => (
                <ArticleCard
                  key={article.id}
                  article={article}
                  variant="rank"
                  rank={index + 1}
                />
              ))}
            </div>
          </section>

          <HavaWidget />
          <KurlarWidget />
          <EczaneWidget />
          <TrafikWidget />

          <AdSlot placement="sidebar-mid" />

          <section
            aria-label="Kategoriler"
            className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-ink-200/70"
          >
            <SectionTitle title="Kategoriler" color="#0f172a" />
            <ul className="flex flex-wrap gap-2">
              {categories.map((category) => (
                <li key={category.slug}>
                  <Link
                    href={`/kategori/${category.slug}`}
                    className="inline-block rounded-full px-3 py-1.5 text-xs font-bold text-white transition hover:opacity-85"
                    style={{ backgroundColor: category.color }}
                  >
                    {category.name}
                  </Link>
                </li>
              ))}
            </ul>
          </section>

          <AdSlot placement="sidebar-bottom" />
        </aside>
      </div>

      {/* ------------------------------------------------ Kategori blokları */}
      {categoryBlocks
        .filter((block) => block.articles.length >= 2)
        .map((block) => (
          <section key={block.category.slug} aria-label={block.category.name} className="mt-10">
            <SectionTitle
              title={block.category.name}
              href={`/kategori/${block.category.slug}`}
              color={block.category.color}
            />
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {block.articles.map((article) => (
                <ArticleCard key={article.id} article={article} variant="small" />
              ))}
            </div>
          </section>
        ))}

      <AdSlot placement="footer" className="mt-10" />
    </div>
  );
}
