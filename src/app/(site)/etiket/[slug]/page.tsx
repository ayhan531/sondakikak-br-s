import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ArticleCard } from "@/components/ArticleCard";
import { AdSlot } from "@/components/ads/AdSlot";
import { getArticlesByTag, getTagBySlug } from "@/lib/queries";
import { getSettings } from "@/lib/settings";

export const revalidate = 300;

type PageProps = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const [tag, settings] = await Promise.all([getTagBySlug(slug), getSettings()]);
  if (!tag) return { title: "Etiket bulunamadı", robots: { index: false } };

  return {
    title: `${tag.name} ile ilgili haberler`,
    description: `${tag.name} konusundaki tüm Kıbrıs haberleri, son dakika gelişmeleri ve detaylar.`,
    alternates: { canonical: `${settings.siteUrl}/etiket/${tag.slug}` },
  };
}

export default async function TagPage({ params }: PageProps) {
  const { slug } = await params;
  const tag = await getTagBySlug(slug);
  if (!tag) notFound();

  const articles = await getArticlesByTag(slug, 36);

  return (
    <div className="mx-auto max-w-7xl px-4 py-5">
      <AdSlot placement="under-header" className="mb-5" />

      <header className="mb-6">
        <p className="text-xs font-bold uppercase tracking-wider text-ink-500">Etiket</p>
        <h1 className="text-2xl font-black text-ink-900 sm:text-3xl">#{tag.name}</h1>
        <p className="mt-1 text-xs text-ink-500">{articles.length} haber</p>
      </header>

      {articles.length === 0 ? (
        <p className="rounded-xl bg-white p-8 text-center text-ink-500 shadow-sm">
          Bu etikete ait haber bulunamadı.
        </p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {articles.map((article, index) => (
            <ArticleCard
              key={article.id}
              article={article}
              variant="small"
              priority={index < 4}
            />
          ))}
        </div>
      )}
    </div>
  );
}
