import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Card, EmptyState, PageHeader, StatCard } from "@/components/admin/ui";
import { formatCount, formatDate } from "@/lib/format";

export const dynamic = "force-dynamic";

type DayBucket = { label: string; date: Date; count: number };

/** Son N günün ziyaret sayılarını gün gün toplar. */
function bucketByDay(rows: Array<{ createdAt: Date }>, days: number): DayBucket[] {
  const buckets: DayBucket[] = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  for (let offset = days - 1; offset >= 0; offset--) {
    const date = new Date(today);
    date.setDate(date.getDate() - offset);
    buckets.push({
      label: `${date.getDate()}.${String(date.getMonth() + 1).padStart(2, "0")}`,
      date,
      count: 0,
    });
  }

  for (const row of rows) {
    const stamp = new Date(row.createdAt);
    stamp.setHours(0, 0, 0, 0);
    const bucket = buckets.find((entry) => entry.date.getTime() === stamp.getTime());
    if (bucket) bucket.count++;
  }

  return buckets;
}

export default async function StatsPage({
  searchParams,
}: {
  searchParams: Promise<{ gun?: string }>;
}) {
  const { gun } = await searchParams;
  const days = [7, 14, 30, 90].includes(Number(gun)) ? Number(gun) : 30;
  const since = new Date();
  since.setDate(since.getDate() - days);
  since.setHours(0, 0, 0, 0);

  const [views, topArticles, byCategory, byDevice, referrers, totals] = await Promise.all([
    prisma.pageView.findMany({
      where: { createdAt: { gte: since } },
      select: { createdAt: true },
    }),
    prisma.article.findMany({
      where: { publishedAt: { gte: since } },
      orderBy: { views: "desc" },
      take: 15,
      select: {
        id: true, slug: true, title: true, views: true,
        category: { select: { name: true, color: true } },
      },
    }),
    prisma.article.groupBy({
      by: ["categoryId"],
      _sum: { views: true },
      _count: true,
    }),
    prisma.pageView.groupBy({
      by: ["device"],
      _count: true,
      where: { createdAt: { gte: since } },
    }),
    prisma.pageView.groupBy({
      by: ["referrer"],
      _count: true,
      where: { createdAt: { gte: since }, referrer: { not: null } },
      orderBy: { _count: { referrer: "desc" } },
      take: 10,
    }),
    prisma.article.aggregate({ _sum: { views: true }, _count: true }),
  ]);

  const categories = await prisma.category.findMany({ select: { id: true, name: true, color: true } });
  const buckets = bucketByDay(views, days);
  const maxCount = Math.max(1, ...buckets.map((bucket) => bucket.count));
  const deviceTotal = byDevice.reduce((sum, row) => sum + row._count, 0) || 1;

  const categoryStats = byCategory
    .map((row) => ({
      name: categories.find((c) => c.id === row.categoryId)?.name ?? "Kategorisiz",
      color: categories.find((c) => c.id === row.categoryId)?.color ?? "#94a3b8",
      views: row._sum.views ?? 0,
      articles: row._count,
    }))
    .sort((a, b) => b.views - a.views);

  const maxCategoryViews = Math.max(1, ...categoryStats.map((row) => row.views));

  const DEVICE_LABELS: Record<string, string> = {
    mobile: "Mobil",
    desktop: "Masaüstü",
    tablet: "Tablet",
  };

  return (
    <>
      <PageHeader
        title="İstatistikler"
        description={`Son ${days} günün verileri`}
        action={
          <div className="flex gap-1.5">
            {[7, 14, 30, 90].map((option) => (
              <Link
                key={option}
                href={`/admin/istatistikler?gun=${option}`}
                className={`rounded-lg px-3 py-2 text-xs font-bold transition ${
                  option === days
                    ? "bg-brand-600 text-white"
                    : "bg-white text-ink-600 ring-1 ring-ink-200 hover:bg-ink-100"
                }`}
              >
                {option} gün
              </Link>
            ))}
          </div>
        }
      />

      <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label={`Son ${days} Gün Okunma`} value={formatCount(views.length)} />
        <StatCard
          label="Günlük Ortalama"
          value={formatCount(Math.round(views.length / days))}
          accent="blue"
        />
        <StatCard label="Toplam Okunma" value={formatCount(totals._sum.views ?? 0)} accent="green" />
        <StatCard label="Toplam Haber" value={formatCount(totals._count)} accent="amber" />
      </div>

      {/* Günlük grafik */}
      <Card className="mb-6" title="Günlük Okunma">
        {views.length === 0 ? (
          <EmptyState message="Bu dönemde henüz okunma verisi yok. Site yayına alındıktan sonra burada dolacak." />
        ) : (
          <div className="overflow-x-auto p-5">
            <div className="flex min-w-full items-end gap-1" style={{ height: 200 }}>
              {buckets.map((bucket) => (
                <div key={bucket.label} className="group flex flex-1 flex-col items-center justify-end gap-1" style={{ minWidth: 14 }}>
                  <span className="text-[10px] font-bold text-ink-500 opacity-0 transition group-hover:opacity-100">
                    {bucket.count}
                  </span>
                  <div
                    className="w-full rounded-t bg-brand-500 transition group-hover:bg-brand-600"
                    style={{ height: `${Math.max(2, (bucket.count / maxCount) * 160)}px` }}
                    title={`${formatDate(bucket.date)}: ${bucket.count} okunma`}
                  />
                  <span className="text-[9px] text-ink-400">{bucket.label}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </Card>

      <div className="grid gap-6 xl:grid-cols-2">
        {/* En çok okunan haberler */}
        <Card title="En Çok Okunan Haberler">
          {topArticles.length === 0 ? (
            <EmptyState message="Veri yok." />
          ) : (
            <ol className="divide-y divide-ink-100">
              {topArticles.map((article, index) => (
                <li key={article.id} className="flex items-start gap-3 px-5 py-2.5">
                  <span className="w-6 text-lg font-black text-ink-300">{index + 1}</span>
                  <div className="min-w-0 flex-1">
                    <Link
                      href={`/haber/${article.slug}`}
                      target="_blank"
                      className="line-clamp-2 text-sm font-medium text-ink-800 hover:text-brand-600"
                    >
                      {article.title}
                    </Link>
                    {article.category && (
                      <span className="text-[11px] font-bold" style={{ color: article.category.color }}>
                        {article.category.name}
                      </span>
                    )}
                  </div>
                  <span className="shrink-0 text-sm font-bold text-ink-600">
                    {formatCount(article.views)}
                  </span>
                </li>
              ))}
            </ol>
          )}
        </Card>

        <div className="space-y-6">
          {/* Kategori dağılımı */}
          <Card title="Kategori Bazında Okunma">
            <ul className="space-y-3 p-5">
              {categoryStats.slice(0, 10).map((row) => (
                <li key={row.name}>
                  <div className="mb-1 flex items-center justify-between text-xs">
                    <span className="font-bold text-ink-700">{row.name}</span>
                    <span className="text-ink-500">
                      {formatCount(row.views)} okunma • {row.articles} haber
                    </span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-ink-100">
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${Math.max(2, (row.views / maxCategoryViews) * 100)}%`,
                        backgroundColor: row.color,
                      }}
                    />
                  </div>
                </li>
              ))}
            </ul>
          </Card>

          {/* Cihaz dağılımı */}
          <Card title="Cihaz Dağılımı">
            {byDevice.length === 0 ? (
              <EmptyState message="Veri yok." />
            ) : (
              <ul className="space-y-3 p-5">
                {byDevice.map((row) => (
                  <li key={row.device ?? "bilinmiyor"}>
                    <div className="mb-1 flex items-center justify-between text-xs">
                      <span className="font-bold text-ink-700">
                        {DEVICE_LABELS[row.device ?? ""] ?? "Bilinmiyor"}
                      </span>
                      <span className="text-ink-500">
                        {formatCount(row._count)} (%{Math.round((row._count / deviceTotal) * 100)})
                      </span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-ink-100">
                      <div
                        className="h-full rounded-full bg-sky-500"
                        style={{ width: `${(row._count / deviceTotal) * 100}%` }}
                      />
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          {/* Yönlendiren siteler */}
          <Card title="Ziyaretçi Kaynakları">
            {referrers.length === 0 ? (
              <EmptyState message="Henüz yönlendirme verisi yok." />
            ) : (
              <ul className="divide-y divide-ink-100">
                {referrers.map((row) => {
                  let host = row.referrer ?? "";
                  try {
                    host = new URL(row.referrer ?? "").hostname;
                  } catch {
                    // Adres ayrıştırılamazsa ham değeri göster
                  }
                  return (
                    <li key={row.referrer} className="flex items-center justify-between gap-3 px-5 py-2.5 text-sm">
                      <span className="truncate text-ink-700">{host || "Doğrudan"}</span>
                      <span className="shrink-0 font-bold text-ink-500">{formatCount(row._count)}</span>
                    </li>
                  );
                })}
              </ul>
            )}
          </Card>
        </div>
      </div>
    </>
  );
}
