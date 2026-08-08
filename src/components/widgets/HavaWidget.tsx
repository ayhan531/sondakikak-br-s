import Link from "next/link";
import { getWeather } from "@/lib/widgets/hava";

/** Sağ sütun hava durumu kartı: 6 KKTC şehri, canlı Open-Meteo verisi. */
export async function HavaWidget() {
  const data = await getWeather();
  if (!data) return null;

  return (
    <section aria-label="Hava durumu" className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-ink-200/70">
      <div className="mb-3 flex items-center justify-between border-b-2 border-ink-900 pb-2">
        <h2 className="text-base font-black uppercase text-ink-900">🌤️ Hava Durumu</h2>
        <Link href="/hava-durumu" className="text-xs font-bold uppercase text-ink-500 transition hover:text-brand-600">
          Detay →
        </Link>
      </div>

      <ul className="divide-y divide-ink-100">
        {data.cities.map((city) => (
          <li key={city.city} className="flex items-center justify-between py-1.5">
            <span className="flex items-center gap-2 text-xs font-bold text-ink-900">
              <span className="text-base" aria-hidden="true">{city.emoji}</span>
              {city.city}
            </span>
            <span className="text-xs font-semibold tabular-nums text-ink-600">
              <span className="text-sm font-black text-ink-900">{city.temperature}°</span>{" "}
              <span className="text-ink-400">
                {city.todayMin}° / {city.todayMax}°
              </span>
            </span>
          </li>
        ))}
      </ul>

      <p className="mt-2 text-[10px] text-ink-400">Canlı veri • Kaynak: Open-Meteo</p>
    </section>
  );
}
