import Link from "next/link";
import { getExchangeRates } from "@/lib/widgets/doviz";
import { getWeather } from "@/lib/widgets/hava";

function fmt(value: number) {
  return new Intl.NumberFormat("tr-TR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

/** Header altındaki canlı bilgi şeridi: hava + döviz + altın. */
export async function InfoBar() {
  const [rates, weather] = await Promise.all([getExchangeRates(), getWeather()]);

  const lefkosa = weather?.cities.find((c) => c.city === "Lefkoşa") ?? weather?.cities[0];
  const gram = rates?.gold.find((g) => g.code === "gram-altin");

  if (!rates && !lefkosa) return null;

  return (
    <div className="border-b border-ink-200 bg-ink-50">
      <div className="scrollbar-thin mx-auto flex max-w-7xl items-center gap-4 overflow-x-auto px-4 py-1.5 text-xs font-semibold text-ink-700">
        {lefkosa && (
          <Link href="/hava-durumu" className="flex shrink-0 items-center gap-1.5 transition hover:text-brand-600">
            <span aria-hidden="true">{lefkosa.emoji}</span>
            <span>
              {lefkosa.city} {lefkosa.temperature}°
            </span>
          </Link>
        )}

        {rates?.currencies.slice(0, 3).map((rate) => (
          <Link
            key={rate.code}
            href="/doviz-kurlari"
            className="flex shrink-0 items-center gap-1.5 transition hover:text-brand-600"
          >
            <span className="text-ink-500">{rate.code}</span>
            <span>{fmt(rate.selling)} ₺</span>
            {typeof rate.change === "number" && (
              <span className={rate.change >= 0 ? "text-emerald-600" : "text-red-600"}>
                {rate.change >= 0 ? "▲" : "▼"}
              </span>
            )}
          </Link>
        ))}

        {gram && (
          <Link href="/doviz-kurlari" className="flex shrink-0 items-center gap-1.5 transition hover:text-brand-600">
            <span className="text-ink-500">GRAM ALTIN</span>
            <span>{fmt(gram.selling)} ₺</span>
          </Link>
        )}

        <Link
          href="/nobetci-eczaneler"
          className="ml-auto flex shrink-0 items-center gap-1.5 rounded-full bg-brand-600/10 px-2.5 py-0.5 font-bold text-brand-700 transition hover:bg-brand-600 hover:text-white"
        >
          <span aria-hidden="true">💊</span> Nöbetçi Eczaneler
        </Link>
      </div>
    </div>
  );
}
