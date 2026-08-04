import { prisma } from "@/lib/prisma";
import { Badge, Card, PageHeader } from "@/components/admin/ui";
import { formatDateTime, timeAgo } from "@/lib/format";
import { CATEGORY_SEED } from "@/lib/categories";
import { deleteSourceAction, runFetchAction, toggleSourceAction } from "./actions";
import { NewSourcePanel, SourceEditor } from "./SourceForm";

export const dynamic = "force-dynamic";

const CATEGORY_OPTIONS = CATEGORY_SEED.map((category) => ({
  slug: category.slug,
  name: category.name,
}));

export default async function SourcesPage() {
  const [sources, recentLogs] = await Promise.all([
    prisma.source.findMany({ orderBy: [{ isActive: "desc" }, { priority: "desc" }] }),
    prisma.fetchLog.findMany({
      take: 15,
      orderBy: { createdAt: "desc" },
      include: { source: { select: { name: true } } },
    }),
  ]);

  return (
    <>
      <PageHeader
        title="Haber Kaynakları"
        description="Anlaşmalı kaynaklardan otomatik haber çekme ayarları"
        action={
          <form action={runFetchAction}>
            <button
              type="submit"
              className="rounded-lg bg-ink-900 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-ink-800"
            >
              Tüm Kaynaklardan Çek
            </button>
          </form>
        }
      />

      <div className="mb-5 rounded-xl bg-sky-50 p-4 text-sm text-sky-900 ring-1 ring-sky-200">
        <p className="font-bold">Otomatik çekim nasıl çalışır?</p>
        <p className="mt-1 leading-relaxed">
          Sunucudaki zamanlanmış görev <code className="rounded bg-sky-100 px-1">/api/cron/haber-cek</code>{" "}
          adresini düzenli aralıklarla çağırır ve aktif kaynakları sırayla tarar. Aynı haberin
          tekrar eklenmesi ve farklı kaynaklardaki aynı haberin çoğaltılması otomatik engellenir.
          Buradaki düğmeler ise anında elle çekim yapar.
        </p>
      </div>

      <div className="mb-6">
        <NewSourcePanel categories={CATEGORY_OPTIONS} />
      </div>

      <Card className="mb-6">
        <ul className="divide-y divide-ink-100">
          {sources.map((source) => {
            let crawlCount = 0;
            try {
              crawlCount = (JSON.parse(source.crawlUrls) as string[]).length;
            } catch {
              crawlCount = 0;
            }

            return (
              <li key={source.id} className="flex flex-wrap items-start gap-3 px-4 py-3.5">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-bold text-ink-900">{source.name}</span>
                    <Badge tone={source.isActive ? "green" : "gray"}>
                      {source.isActive ? "Aktif" : "Kapalı"}
                    </Badge>
                    <Badge tone="blue">{source.mode === "rss" ? "RSS" : "Tarama"}</Badge>
                    {source.lastError && <Badge tone="red">Hata</Badge>}
                  </div>

                  <p className="mt-1 truncate text-xs text-ink-500">
                    {source.mode === "rss" ? source.feedUrl : `${crawlCount} liste sayfası`}
                  </p>

                  <p className="mt-1 text-[11px] text-ink-400">
                    {source.lastFetchedAt
                      ? `Son çekim: ${timeAgo(source.lastFetchedAt)}`
                      : "Henüz çekilmedi"}
                    {` • ${source.articleCount} haber • turda en fazla ${source.maxPerRun}`}
                    {` • öncelik ${source.priority}`}
                  </p>

                  {source.lastError && (
                    <p className="mt-1 rounded bg-brand-50 px-2 py-1 text-[11px] text-brand-700">
                      {source.lastError}
                    </p>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-1.5">
                  <form action={runFetchAction}>
                    <input type="hidden" name="sourceSlug" value={source.slug} />
                    <button
                      type="submit"
                      className="rounded bg-brand-600 px-2.5 py-1 text-[11px] font-bold text-white transition hover:bg-brand-700"
                    >
                      Şimdi Çek
                    </button>
                  </form>

                  <form action={toggleSourceAction}>
                    <input type="hidden" name="id" value={source.id} />
                    <button
                      type="submit"
                      className="rounded bg-ink-100 px-2.5 py-1 text-[11px] font-bold text-ink-600 transition hover:bg-ink-200"
                    >
                      {source.isActive ? "Durdur" : "Başlat"}
                    </button>
                  </form>

                  <SourceEditor
                    categories={CATEGORY_OPTIONS}
                    source={{
                      id: source.id,
                      name: source.name,
                      homepage: source.homepage,
                      mode: source.mode,
                      feedUrl: source.feedUrl,
                      crawlUrls: source.crawlUrls,
                      linkPattern: source.linkPattern,
                      defaultCategorySlug: source.defaultCategorySlug,
                      maxPerRun: source.maxPerRun,
                      priority: source.priority,
                      isActive: source.isActive,
                      autoPublish: source.autoPublish,
                    }}
                  />

                  <form action={deleteSourceAction}>
                    <input type="hidden" name="id" value={source.id} />
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
      </Card>

      <Card title="Çekim Geçmişi">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-ink-200 text-left text-[11px] uppercase tracking-wide text-ink-500">
                <th className="px-4 py-2.5 font-bold">Kaynak</th>
                <th className="px-4 py-2.5 font-bold">Tarih</th>
                <th className="px-4 py-2.5 text-right font-bold">Bulunan</th>
                <th className="px-4 py-2.5 text-right font-bold">Eklenen</th>
                <th className="px-4 py-2.5 text-right font-bold">Atlanan</th>
                <th className="px-4 py-2.5 text-right font-bold">Süre</th>
                <th className="px-4 py-2.5 font-bold">Durum</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink-100">
              {recentLogs.map((log) => (
                <tr key={log.id}>
                  <td className="px-4 py-2.5 font-semibold text-ink-800">
                    {log.source?.name ?? "—"}
                  </td>
                  <td className="px-4 py-2.5 text-xs text-ink-500">{formatDateTime(log.createdAt)}</td>
                  <td className="px-4 py-2.5 text-right text-ink-600">{log.found}</td>
                  <td className="px-4 py-2.5 text-right font-bold text-emerald-600">{log.created}</td>
                  <td className="px-4 py-2.5 text-right text-ink-400">{log.skipped}</td>
                  <td className="px-4 py-2.5 text-right text-xs text-ink-500">
                    {(log.durationMs / 1000).toFixed(1)} sn
                  </td>
                  <td className="px-4 py-2.5">
                    {log.error ? (
                      <span className="text-xs text-brand-600">{log.error.slice(0, 40)}</span>
                    ) : (
                      <Badge tone="green">Başarılı</Badge>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </>
  );
}
