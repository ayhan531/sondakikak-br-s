import type { Metadata } from "next";
import { getExchangeRates, type Rate } from "@/lib/widgets/doviz";
import { KurCevirici } from "@/components/widgets/KurCevirici";
import { AdSlot } from "@/components/ads/AdSlot";

// Canlı piyasa verisi her istekte (bellek önbelleğiyle) sunulur
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Canlı Döviz Kurları ve Altın Fiyatları — Dolar, Euro, Sterlin",
  description:
    "Güncel dolar, euro, sterlin kuru ve altın fiyatları. Canlı döviz çevirici ile TL karşılıklarını anında hesaplayın. Kıbrıs için güncel piyasa verileri.",
  alternates: { canonical: "https://sondakikakibris.com/doviz-kurlari" },
};

function fmt(value: number) {
  return new Intl.NumberFormat("tr-TR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

function RateTable({ title, rates }: { title: string; rates: Rate[] }) {
  if (!rates.length) return null;
  return (
    <section aria-label={title} className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-ink-200/70">
      <h2 className="mb-3 border-b-2 border-ink-900 pb-2 text-base font-black uppercase text-ink-900">
        {title}
      </h2>
      <table className="w-full">
        <thead>
          <tr className="text-xs font-bold uppercase tracking-wide text-ink-400">
            <th className="pb-2 text-left">Birim</th>
            <th className="pb-2 text-right">Alış (₺)</th>
            <th className="pb-2 text-right">Satış (₺)</th>
            <th className="pb-2 text-right">Değişim</th>
          </tr>
        </thead>
        <tbody>
          {rates.map((rate) => (
            <tr key={rate.code} className="border-b border-ink-100 last:border-0">
              <td className="py-2.5 pr-2 text-sm font-bold text-ink-900">{rate.name}</td>
              <td className="py-2.5 pr-2 text-right text-sm font-semibold tabular-nums text-ink-700">
                {fmt(rate.buying)}
              </td>
              <td className="py-2.5 pr-2 text-right text-sm font-semibold tabular-nums text-ink-700">
                {fmt(rate.selling)}
              </td>
              <td className="py-2.5 text-right text-sm font-bold tabular-nums">
                {typeof rate.change === "number" ? (
                  <span className={rate.change >= 0 ? "text-emerald-600" : "text-red-600"}>
                    %{fmt(Math.abs(rate.change))} {rate.change >= 0 ? "▲" : "▼"}
                  </span>
                ) : (
                  <span className="text-ink-400">—</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}

export default async function DovizKurlariPage() {
  const data = await getExchangeRates();

  return (
    <div className="mx-auto max-w-7xl px-4 py-6">
      <header className="mb-6">
        <h1 className="text-2xl font-black text-ink-900 sm:text-3xl">💱 Döviz Kurları &amp; Altın</h1>
        <p className="mt-2 text-sm text-ink-600">
          Canlı piyasa verileri — dakikada bir güncellenir.
          {data?.updatedAt ? ` Son güncelleme: ${data.updatedAt}` : ""}
        </p>
      </header>

      <AdSlot placement="under-header" className="mb-6" />

      {!data ? (
        <p className="rounded-xl bg-white p-8 text-center text-ink-500 shadow-sm">
          Piyasa verileri şu anda alınamıyor. Lütfen birkaç dakika sonra tekrar deneyin.
        </p>
      ) : (
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="space-y-6 lg:col-span-2">
            <RateTable title="Döviz Kurları" rates={data.currencies} />
            <RateTable title="Altın Fiyatları" rates={data.gold} />
          </div>
          <aside className="space-y-6">
            <section className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-ink-200/70">
              <h2 className="border-b-2 border-ink-900 pb-2 text-base font-black uppercase text-ink-900">
                Hesaplayıcı
              </h2>
              <KurCevirici
                rates={data.currencies.map(({ code, name, selling }) => ({ code, name, selling }))}
              />
            </section>
            <AdSlot placement="sidebar-top" />
          </aside>
        </div>
      )}

      <p className="mt-8 text-xs text-ink-400">
        Veriler {data?.source === "tcmb" ? "TCMB resmî kurlarından" : "TCMB tabanlı serbest piyasadan"}{" "}
        canlı alınır; bilgilendirme amaçlıdır.
      </p>

      <AdSlot placement="footer" className="mt-8" />
    </div>
  );
}
