import type { Metadata } from "next";
import { ArticleCard } from "@/components/ArticleCard";
import { SearchBox } from "@/components/SearchBox";
import { Pagination } from "@/components/Pagination";
import { searchArticles } from "@/lib/queries";

const PER_PAGE = 20;

export const metadata: Metadata = {
  title: "Arama",
  // Arama sonuç sayfaları arama motorlarında dizine eklenmemeli
  robots: { index: false, follow: true },
};

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; sayfa?: string }>;
}) {
  const { q = "", sayfa } = await searchParams;
  const query = q.trim();
  const page = Math.max(1, Number(sayfa) || 1);

  const { results, total } = query
    ? await searchArticles(query, PER_PAGE, (page - 1) * PER_PAGE)
    : { results: [], total: 0 };

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <h1 className="mb-4 text-2xl font-black text-ink-900 sm:text-3xl">Haber Ara</h1>

      <SearchBox
        className="mb-6"
        defaultValue={query}
        autoFocus={!query}
        placeholder="Aramak istediğiniz kelimeyi yazın…"
      />

      {query && (
        <p className="mb-5 text-sm text-ink-600">
          <strong className="text-ink-900">{query}</strong> için {total} sonuç bulundu
        </p>
      )}

      {query && results.length === 0 && (
        <div className="rounded-xl bg-white p-10 text-center shadow-sm ring-1 ring-ink-200/70">
          <p className="text-lg font-bold text-ink-900">Sonuç bulunamadı</p>
          <p className="mt-2 text-sm text-ink-500">
            Farklı bir kelime deneyin veya yazımı kontrol edin.
          </p>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {results.map((article) => (
          <ArticleCard key={article.id} article={article} variant="medium" />
        ))}
      </div>

      <Pagination
        page={page}
        totalPages={Math.ceil(total / PER_PAGE)}
        basePath="/arama"
        query={`q=${encodeURIComponent(query)}`}
      />
    </div>
  );
}
