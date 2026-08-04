import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Card, PageHeader, StatCard, Badge, EmptyState, Button } from "@/components/admin/ui";
import { formatCount, formatDateTime, timeAgo } from "@/lib/format";

export const dynamic = "force-dynamic";

function startOfToday(): Date {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  return date;
}

function daysAgo(days: number): Date {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date;
}

export default async function DashboardPage() {
  const today = startOfToday();
  const weekAgo = daysAgo(7);

  const [
    totalArticles,
    publishedToday,
    draftCount,
    viewsAggregate,
    viewsToday,
    viewsWeek,
    sources,
    recentArticles,
    topArticles,
    recentLogs,
    adStats,
  ] = await Promise.all([
    prisma.article.count(),
    prisma.article.count({ where: { createdAt: { gte: today } } }),
    prisma.article.count({ where: { status: "draft" } }),
    prisma.article.aggregate({ _sum: { views: true } }),
    prisma.pageView.count({ where: { createdAt: { gte: today } } }),
    prisma.pageView.count({ where: { createdAt: { gte: weekAgo } } }),
    prisma.source.findMany({ orderBy: { priority: "desc" } }),
    prisma.article.findMany({
      take: 8,
      orderBy: { createdAt: "desc" },
      select: {
        id: true, slug: true, title: true, status: true, createdAt: true,
        views: true, category: { select: { name: true, color: true } }, sourceName: true,
      },
    }),
    prisma.article.findMany({
      take: 6,
      where: { publishedAt: { gte: weekAgo } },
      orderBy: { views: "desc" },
      select: { id: true, slug: true, title: true, views: true },
    }),
    prisma.fetchLog.findMany({
      take: 6,
      orderBy: { createdAt: "desc" },
      include: { source: { select: { name: true } } },
    }),
    prisma.adSlot.aggregate({ _sum: { impressions: true, clicks: true }, where: { isActive: true } }),
  ]);

  const activeSources = sources.filter((source) => source.isActive).length;
  const failingSources = sources.filter((source) => source.lastError);

  return (
    <>
      <PageHeader
        title="Genel Bakış"
        description="Sitenin güncel durumu ve son hareketler"
        action={<Button href="/admin/haberler/yeni">+ Yeni Haber</Button>}
      />

      <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Toplam Haber"
          value={formatCount(totalArticles)}
          hint={`Bugün ${publishedToday} yeni${draftCount ? ` • ${draftCount} taslak` : ""}`}
        />
        <StatCard
          label="Bugünkü Okunma"
          value={formatCount(viewsToday)}
          hint={`Son 7 gün: ${formatCount(viewsWeek)}`}
          accent="green"
        />
        <StatCard
          label="Toplam Okunma"
          value={formatCount(viewsAggregate._sum.views ?? 0)}
          accent="blue"
        />
        <StatCard
          label="Reklam Tıklaması"
          value={formatCount(adStats._sum.clicks ?? 0)}
          hint={`${formatCount(adStats._sum.impressions ?? 0)} gösterim`}
          accent="amber"
        />
      </div>

      {failingSources.length > 0 && (
        <div className="mb-6 rounded-xl bg-amber-50 p-4 ring-1 ring-amber-200">
          <p className="text-sm font-bold text-amber-800">
            {failingSources.length} kaynakta hata var
          </p>
          <ul className="mt-1.5 space-y-0.5 text-xs text-amber-700">
            {failingSources.map((source) => (
              <li key={source.id}>
                <strong>{source.name}:</strong> {source.lastError}
              </li>
            ))}
          </ul>
          <Link
            href="/admin/kaynaklar"
            className="mt-2 inline-block text-xs font-bold text-amber-900 underline"
          >
            Kaynakları yönet →
          </Link>
        </div>
      )}

      <div className="grid gap-6 xl:grid-cols-3">
        {/* Son eklenen haberler */}
        <Card
          className="xl:col-span-2"
          title="Son Eklenen Haberler"
          action={
            <Link href="/admin/haberler" className="text-xs font-bold text-brand-600 hover:underline">
              Tümü →
            </Link>
          }
        >
          {recentArticles.length === 0 ? (
            <EmptyState message="Henüz haber yok. Kaynaklardan haber çekerek başlayın." />
          ) : (
            <ul className="divide-y divide-ink-100">
              {recentArticles.map((article) => (
                <li key={article.id} className="flex items-start gap-3 px-5 py-3">
                  <div className="min-w-0 flex-1">
                    <Link
                      href={`/admin/haberler/${article.id}`}
                      className="line-clamp-2 text-sm font-semibold text-ink-900 hover:text-brand-600"
                    >
                      {article.title}
                    </Link>
                    <div className="mt-1 flex flex-wrap items-center gap-2 text-[11px] text-ink-500">
                      {article.category && (
                        <span className="font-semibold" style={{ color: article.category.color }}>
                          {article.category.name}
                        </span>
                      )}
                      <span>{article.sourceName}</span>
                      <span>{timeAgo(article.createdAt)}</span>
                      <span>{formatCount(article.views)} okunma</span>
                    </div>
                  </div>
                  <Badge tone={article.status === "published" ? "green" : "amber"}>
                    {article.status === "published" ? "Yayında" : "Taslak"}
                  </Badge>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <div className="space-y-6">
          {/* Kaynak durumu */}
          <Card
            title={`Kaynaklar (${activeSources}/${sources.length} aktif)`}
            action={
              <Link href="/admin/kaynaklar" className="text-xs font-bold text-brand-600 hover:underline">
                Yönet →
              </Link>
            }
          >
            <ul className="divide-y divide-ink-100">
              {sources.map((source) => (
                <li key={source.id} className="flex items-center justify-between gap-2 px-5 py-2.5">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-ink-800">{source.name}</p>
                    <p className="text-[11px] text-ink-400">
                      {source.lastFetchedAt ? timeAgo(source.lastFetchedAt) : "hiç çekilmedi"}
                      {" • "}
                      {source.articleCount} haber
                    </p>
                  </div>
                  <Badge tone={!source.isActive ? "gray" : source.lastError ? "red" : "green"}>
                    {!source.isActive ? "Kapalı" : source.lastError ? "Hata" : "Aktif"}
                  </Badge>
                </li>
              ))}
            </ul>
          </Card>

          {/* En çok okunanlar */}
          <Card title="Haftanın En Çok Okunanları">
            {topArticles.length === 0 ? (
              <EmptyState message="Henüz okunma verisi yok." />
            ) : (
              <ol className="divide-y divide-ink-100">
                {topArticles.map((article, index) => (
                  <li key={article.id} className="flex items-start gap-3 px-5 py-2.5">
                    <span className="text-lg font-black text-ink-300">{index + 1}</span>
                    <Link
                      href={`/haber/${article.slug}`}
                      target="_blank"
                      className="line-clamp-2 flex-1 text-sm font-medium text-ink-800 hover:text-brand-600"
                    >
                      {article.title}
                    </Link>
                    <span className="shrink-0 text-xs font-bold text-ink-500">
                      {formatCount(article.views)}
                    </span>
                  </li>
                ))}
              </ol>
            )}
          </Card>

          {/* Çekim geçmişi */}
          <Card title="Son Çekim İşlemleri">
            {recentLogs.length === 0 ? (
              <EmptyState message="Henüz çekim yapılmadı." />
            ) : (
              <ul className="divide-y divide-ink-100">
                {recentLogs.map((log) => (
                  <li key={log.id} className="px-5 py-2.5">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm font-semibold text-ink-800">
                        {log.source?.name ?? "Bilinmeyen"}
                      </span>
                      <Badge tone={log.error ? "red" : log.created > 0 ? "green" : "gray"}>
                        {log.error ? "Hata" : `+${log.created}`}
                      </Badge>
                    </div>
                    <p className="mt-0.5 text-[11px] text-ink-400">
                      {formatDateTime(log.createdAt)} • {(log.durationMs / 1000).toFixed(1)} sn
                      {log.error ? ` • ${log.error.slice(0, 60)}` : ""}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>
      </div>
    </>
  );
}
