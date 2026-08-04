import Image from "next/image";
import { prisma } from "@/lib/prisma";
import { Badge, Card, EmptyState, PageHeader, StatCard } from "@/components/admin/ui";
import { PLACEMENT_LABELS } from "@/components/ads/AdSlot";
import { formatCount, formatDate } from "@/lib/format";
import { deleteAdAction, resetAdStatsAction, toggleAdAction } from "./actions";
import { AdEditor, NewAdPanel } from "./AdForm";

export const dynamic = "force-dynamic";

const PLACEMENTS = Object.entries(PLACEMENT_LABELS);

function localDateTimeValue(date: Date | null): string {
  if (!date) return "";
  const offset = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
}

export default async function AdsPage() {
  const [ads, totals] = await Promise.all([
    prisma.adSlot.findMany({ orderBy: [{ placement: "asc" }, { order: "asc" }] }),
    prisma.adSlot.aggregate({ _sum: { impressions: true, clicks: true } }),
  ]);

  const impressions = totals._sum.impressions ?? 0;
  const clicks = totals._sum.clicks ?? 0;
  const ctr = impressions > 0 ? ((clicks / impressions) * 100).toFixed(2) : "0,00";
  const activeCount = ads.filter((ad) => ad.isActive).length;

  return (
    <>
      <PageHeader
        title="Reklamlar"
        description="Sitedeki reklam alanlarını buradan yönetin"
      />

      <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Yayındaki Reklam" value={`${activeCount} / ${ads.length}`} />
        <StatCard label="Toplam Gösterim" value={formatCount(impressions)} accent="blue" />
        <StatCard label="Toplam Tıklama" value={formatCount(clicks)} accent="green" />
        <StatCard label="Tıklama Oranı" value={`%${ctr.replace(".", ",")}`} accent="amber" />
      </div>

      <div className="mb-6">
        <NewAdPanel placements={PLACEMENTS} />
      </div>

      <Card>
        {ads.length === 0 ? (
          <EmptyState message="Henüz reklam eklenmemiş." />
        ) : (
          <ul className="divide-y divide-ink-100">
            {ads.map((ad) => {
              const adCtr =
                ad.impressions > 0 ? ((ad.clicks / ad.impressions) * 100).toFixed(2) : "0,00";
              const expired = ad.endsAt && ad.endsAt < new Date();

              return (
                <li key={ad.id} className="flex flex-wrap items-start gap-3 px-4 py-3.5">
                  <div className="relative h-12 w-24 shrink-0 overflow-hidden rounded bg-ink-100">
                    {ad.type === "image" && ad.imageUrl ? (
                      <Image src={ad.imageUrl} alt="" fill sizes="96px" className="object-contain" unoptimized />
                    ) : (
                      <div className="flex h-full items-center justify-center text-[10px] font-bold text-ink-400">
                        HTML
                      </div>
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-bold text-ink-900">{ad.name}</span>
                      <Badge tone={ad.isActive && !expired ? "green" : "gray"}>
                        {expired ? "Süresi doldu" : ad.isActive ? "Yayında" : "Kapalı"}
                      </Badge>
                    </div>

                    <p className="mt-0.5 text-xs text-ink-500">
                      {PLACEMENT_LABELS[ad.placement as keyof typeof PLACEMENT_LABELS] ?? ad.placement}
                    </p>

                    <p className="mt-1 text-[11px] text-ink-400">
                      {formatCount(ad.impressions)} gösterim • {formatCount(ad.clicks)} tıklama •
                      {` %${adCtr.replace(".", ",")} TO`}
                      {ad.startsAt || ad.endsAt
                        ? ` • ${ad.startsAt ? formatDate(ad.startsAt) : "…"} – ${
                            ad.endsAt ? formatDate(ad.endsAt) : "süresiz"
                          }`
                        : ""}
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-1.5">
                    <form action={toggleAdAction}>
                      <input type="hidden" name="id" value={ad.id} />
                      <button
                        type="submit"
                        className="rounded bg-ink-100 px-2.5 py-1 text-[11px] font-bold text-ink-600 transition hover:bg-ink-200"
                      >
                        {ad.isActive ? "Durdur" : "Yayınla"}
                      </button>
                    </form>

                    <AdEditor
                      placements={PLACEMENTS}
                      ad={{
                        id: ad.id,
                        name: ad.name,
                        placement: ad.placement,
                        type: ad.type,
                        htmlCode: ad.htmlCode,
                        imageUrl: ad.imageUrl,
                        imageUrlMobile: ad.imageUrlMobile,
                        linkUrl: ad.linkUrl,
                        altText: ad.altText,
                        isActive: ad.isActive,
                        order: ad.order,
                        startsAt: localDateTimeValue(ad.startsAt),
                        endsAt: localDateTimeValue(ad.endsAt),
                      }}
                    />

                    <form action={resetAdStatsAction}>
                      <input type="hidden" name="id" value={ad.id} />
                      <button
                        type="submit"
                        className="rounded bg-ink-100 px-2.5 py-1 text-[11px] font-bold text-ink-600 transition hover:bg-ink-200"
                      >
                        Sayaç Sıfırla
                      </button>
                    </form>

                    <form action={deleteAdAction}>
                      <input type="hidden" name="id" value={ad.id} />
                      <button
                        type="submit"
                        className="rounded bg-brand-50 px-2.5 py-1 text-[11px] font-bold text-brand-700 transition hover:bg-brand-100"
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
    </>
  );
}
