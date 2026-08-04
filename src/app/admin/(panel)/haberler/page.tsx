import Link from "next/link";
import Image from "next/image";
import { prisma } from "@/lib/prisma";
import { Badge, Button, Card, EmptyState, PageHeader, inputClass, selectClass } from "@/components/admin/ui";
import { formatCount, formatDateTime } from "@/lib/format";
import { searchNormalize } from "@/lib/text";
import { deleteArticleAction, setArticleStatusAction, updateArticleFlagAction } from "./actions";
import type { Prisma } from "@/generated/prisma/client";

export const dynamic = "force-dynamic";

const PER_PAGE = 25;

type PageProps = {
  searchParams: Promise<{
    q?: string;
    kategori?: string;
    durum?: string;
    kaynak?: string;
    sayfa?: string;
  }>;
};

export default async function AdminArticlesPage({ searchParams }: PageProps) {
  const { q = "", kategori = "", durum = "", kaynak = "", sayfa } = await searchParams;
  const page = Math.max(1, Number(sayfa) || 1);

  const where: Prisma.ArticleWhereInput = {
    ...(q.trim() ? { searchText: { contains: searchNormalize(q) } } : {}),
    ...(kategori ? { categoryId: kategori } : {}),
    ...(durum ? { status: durum } : {}),
    ...(kaynak ? { sourceId: kaynak } : {}),
  };

  const [articles, total, categories, sources] = await Promise.all([
    prisma.article.findMany({
      where,
      orderBy: { publishedAt: "desc" },
      take: PER_PAGE,
      skip: (page - 1) * PER_PAGE,
      select: {
        id: true, slug: true, title: true, status: true, publishedAt: true, views: true,
        isBreaking: true, isHeadline: true, imageLocal: true, imageUrl: true,
        sourceName: true, category: { select: { name: true, color: true } },
      },
    }),
    prisma.article.count({ where }),
    prisma.category.findMany({ orderBy: { order: "asc" }, select: { id: true, name: true } }),
    prisma.source.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
  ]);

  const totalPages = Math.ceil(total / PER_PAGE);
  const filterQuery = new URLSearchParams(
    Object.entries({ q, kategori, durum, kaynak }).filter(([, value]) => value)
  ).toString();

  return (
    <>
      <PageHeader
        title="Haberler"
        description={`${total} haber bulundu`}
        action={<Button href="/admin/haberler/yeni">+ Yeni Haber</Button>}
      />

      {/* Filtreler */}
      <form method="get" className="mb-5 grid gap-3 rounded-xl bg-white p-4 shadow-sm ring-1 ring-ink-200/70 sm:grid-cols-2 lg:grid-cols-5">
        <input
          name="q"
          defaultValue={q}
          placeholder="Başlık veya içerikte ara…"
          className={`${inputClass} lg:col-span-2`}
        />
        <select name="kategori" defaultValue={kategori} className={selectClass}>
          <option value="">Tüm kategoriler</option>
          {categories.map((category) => (
            <option key={category.id} value={category.id}>{category.name}</option>
          ))}
        </select>
        <select name="kaynak" defaultValue={kaynak} className={selectClass}>
          <option value="">Tüm kaynaklar</option>
          {sources.map((source) => (
            <option key={source.id} value={source.id}>{source.name}</option>
          ))}
        </select>
        <div className="flex gap-2">
          <select name="durum" defaultValue={durum} className={selectClass}>
            <option value="">Tüm durumlar</option>
            <option value="published">Yayında</option>
            <option value="draft">Taslak</option>
            <option value="archived">Arşiv</option>
          </select>
          <Button type="submit" variant="secondary">Filtrele</Button>
        </div>
      </form>

      <Card>
        {articles.length === 0 ? (
          <EmptyState
            message="Bu filtrelere uyan haber yok."
            action={<Button href="/admin/haberler" variant="ghost">Filtreleri temizle</Button>}
          />
        ) : (
          <ul className="divide-y divide-ink-100">
            {articles.map((article) => {
              const image = article.imageLocal ?? article.imageUrl;
              return (
                <li key={article.id} className="flex flex-wrap items-start gap-3 px-4 py-3 sm:flex-nowrap">
                  <div className="relative h-14 w-20 shrink-0 overflow-hidden rounded-lg bg-ink-100">
                    {image && (
                      <Image src={image} alt="" fill sizes="80px" className="object-cover" />
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <Link
                      href={`/admin/haberler/${article.id}`}
                      className="line-clamp-2 text-sm font-bold text-ink-900 hover:text-brand-600"
                    >
                      {article.title}
                    </Link>
                    <div className="mt-1 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-[11px] text-ink-500">
                      {article.category && (
                        <span className="font-bold" style={{ color: article.category.color }}>
                          {article.category.name}
                        </span>
                      )}
                      <span>{formatDateTime(article.publishedAt)}</span>
                      <span>{formatCount(article.views)} okunma</span>
                      {article.sourceName && <span>· {article.sourceName}</span>}
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-1.5">
                    <Badge tone={article.status === "published" ? "green" : article.status === "draft" ? "amber" : "gray"}>
                      {article.status === "published" ? "Yayında" : article.status === "draft" ? "Taslak" : "Arşiv"}
                    </Badge>

                    {/* Son dakika işareti */}
                    <form action={updateArticleFlagAction}>
                      <input type="hidden" name="id" value={article.id} />
                      <input type="hidden" name="field" value="isBreaking" />
                      <input type="hidden" name="value" value={String(!article.isBreaking)} />
                      <button
                        type="submit"
                        title="Son dakika olarak işaretle"
                        className={`rounded px-2 py-1 text-[11px] font-bold transition ${
                          article.isBreaking
                            ? "bg-brand-600 text-white"
                            : "bg-ink-100 text-ink-500 hover:bg-ink-200"
                        }`}
                      >
                        SD
                      </button>
                    </form>

                    {/* Manşet işareti */}
                    <form action={updateArticleFlagAction}>
                      <input type="hidden" name="id" value={article.id} />
                      <input type="hidden" name="field" value="isHeadline" />
                      <input type="hidden" name="value" value={String(!article.isHeadline)} />
                      <button
                        type="submit"
                        title="Manşete al"
                        className={`rounded px-2 py-1 text-[11px] font-bold transition ${
                          article.isHeadline
                            ? "bg-ink-900 text-white"
                            : "bg-ink-100 text-ink-500 hover:bg-ink-200"
                        }`}
                      >
                        MANŞET
                      </button>
                    </form>

                    {/* Yayın durumu */}
                    <form action={setArticleStatusAction}>
                      <input type="hidden" name="id" value={article.id} />
                      <input
                        type="hidden"
                        name="status"
                        value={article.status === "published" ? "draft" : "published"}
                      />
                      <button
                        type="submit"
                        className="rounded bg-ink-100 px-2 py-1 text-[11px] font-bold text-ink-600 transition hover:bg-ink-200"
                      >
                        {article.status === "published" ? "Yayından kaldır" : "Yayınla"}
                      </button>
                    </form>

                    <Link
                      href={`/haber/${article.slug}`}
                      target="_blank"
                      className="rounded bg-ink-100 px-2 py-1 text-[11px] font-bold text-ink-600 transition hover:bg-ink-200"
                    >
                      Gör
                    </Link>

                    <form action={deleteArticleAction}>
                      <input type="hidden" name="id" value={article.id} />
                      <button
                        type="submit"
                        className="rounded bg-brand-50 px-2 py-1 text-[11px] font-bold text-brand-700 transition hover:bg-brand-100"
                      >
                        Sil
                      </button>
                    </form>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </Card>

      {/* Sayfalama */}
      {totalPages > 1 && (
        <nav className="mt-6 flex flex-wrap items-center justify-center gap-2">
          {Array.from({ length: Math.min(totalPages, 12) }, (_, i) => i + 1).map((target) => (
            <Link
              key={target}
              href={`/admin/haberler?${filterQuery ? `${filterQuery}&` : ""}sayfa=${target}`}
              className={`rounded-lg px-3 py-1.5 text-sm font-bold transition ${
                target === page
                  ? "bg-brand-600 text-white"
                  : "bg-white text-ink-600 ring-1 ring-ink-200 hover:bg-ink-100"
              }`}
            >
              {target}
            </Link>
          ))}
        </nav>
      )}
    </>
  );
}
