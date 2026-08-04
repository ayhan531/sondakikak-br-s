import Link from "next/link";
import { ArticleCard } from "@/components/ArticleCard";
import { SearchBox } from "@/components/SearchBox";
import { getLatest } from "@/lib/queries";

export default async function NotFound() {
  const latest = await getLatest({ take: 4 });

  return (
    <div className="mx-auto max-w-4xl px-4 py-16 text-center">
      <p className="text-7xl font-black text-brand-600 sm:text-8xl">404</p>
      <h1 className="mt-3 text-2xl font-black text-ink-900 sm:text-3xl">Sayfa bulunamadı</h1>
      <p className="mx-auto mt-3 max-w-md text-ink-600">
        Aradığınız haber kaldırılmış veya adres değişmiş olabilir. Aşağıdan arama yapabilir ya da
        son haberlere göz atabilirsiniz.
      </p>

      <div className="mx-auto mt-6 max-w-md">
        <SearchBox />
      </div>

      <Link
        href="/"
        className="mt-5 inline-block rounded-full bg-ink-900 px-6 py-3 text-sm font-bold text-white transition hover:bg-brand-600"
      >
        Ana Sayfaya Dön
      </Link>

      {latest.length > 0 && (
        <section className="mt-14 text-left">
          <h2 className="mb-4 border-b-2 border-brand-600 pb-2 text-lg font-black uppercase text-ink-900">
            Son Haberler
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {latest.map((article) => (
              <ArticleCard key={article.id} article={article} variant="small" />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
