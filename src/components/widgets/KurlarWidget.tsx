import Link from "next/link";
import { getExchangeRates, type Rate } from "@/lib/widgets/doviz";
import { KurCevirici } from "./KurCevirici";

function fmt(value: number) {
  return new Intl.NumberFormat("tr-TR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

function Row({ rate }: { rate: Rate }) {
  return (
    <tr className="border-b border-ink-100 last:border-0">
      <td className="py-1.5 pr-2 text-xs font-bold text-ink-900">{rate.name}</td>
      <td className="py-1.5 pr-2 text-right text-xs font-semibold tabular-nums text-ink-700">
        {fmt(rate.buying)}
      </td>
      <td className="py-1.5 pr-2 text-right text-xs font-semibold tabular-nums text-ink-700">
        {fmt(rate.selling)}
      </td>
      <td className="py-1.5 text-right text-xs font-bold tabular-nums">
        {typeof rate.change === "number" ? (
          <span className={rate.change >= 0 ? "text-emerald-600" : "text-red-600"}>
            %{fmt(Math.abs(rate.change))} {rate.change >= 0 ? "▲" : "▼"}
          </span>
        ) : (
          <span className="text-ink-400">—</span>
        )}
      </td>
    </tr>
  );
}

/** Sağ sütun döviz + altın kartı; çeviriciyle birlikte. */
export async function KurlarWidget({ withConverter = true }: { withConverter?: boolean }) {
  const data = await getExchangeRates();
  if (!data) return null;

  return (
    <section aria-label="Döviz kurları" className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-ink-200/70">
      <div className="mb-3 flex items-center justify-between border-b-2 border-ink-900 pb-2">
        <h2 className="text-base font-black uppercase text-ink-900">💱 Döviz &amp; Altın</h2>
        <Link href="/doviz-kurlari" className="text-xs font-bold uppercase text-ink-500 transition hover:text-brand-600">
          Tümü →
        </Link>
      </div>

      <table className="w-full">
        <thead>
          <tr className="text-[10px] font-bold uppercase tracking-wide text-ink-400">
            <th className="pb-1 text-left">Birim</th>
            <th className="pb-1 text-right">Alış</th>
            <th className="pb-1 text-right">Satış</th>
            <th className="pb-1 text-right">Fark</th>
          </tr>
        </thead>
        <tbody>
          {data.currencies.map((rate) => (
            <Row key={rate.code} rate={rate} />
          ))}
          {data.gold.slice(0, 2).map((rate) => (
            <Row key={rate.code} rate={rate} />
          ))}
        </tbody>
      </table>

      {withConverter && (
        <KurCevirici
          rates={data.currencies.map(({ code, name, selling }) => ({ code, name, selling }))}
        />
      )}

      <p className="mt-2 text-[10px] text-ink-400">
        Canlı veri • {data.source === "tcmb" ? "Kaynak: TCMB" : "TCMB tabanlı serbest piyasa"}
      </p>
    </section>
  );
}
