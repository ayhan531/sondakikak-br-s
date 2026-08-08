import type { Metadata } from "next";
import { CloudSun, Droplets, Wind } from "lucide-react";
import { getWeather, describeWeather } from "@/lib/widgets/hava";
import { WeatherIcon } from "@/components/widgets/WeatherIcon";
import { AdSlot } from "@/components/ads/AdSlot";

// Canlı hava verisi her istekte (bellek önbelleğiyle) sunulur
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "KKTC Hava Durumu — Lefkoşa, Girne, Gazimağusa",
  description:
    "Lefkoşa, Girne, Gazimağusa, Güzelyurt, İskele ve Lefke için anlık sıcaklık, nem, rüzgar ve yarının tahmini. Kıbrıs hava durumu.",
  alternates: { canonical: "https://sondakikakibris.com/hava-durumu" },
};

export default async function HavaDurumuPage() {
  const data = await getWeather();

  return (
    <div className="mx-auto max-w-7xl px-4 py-6">
      <header className="mb-6">
        <h1 className="flex items-center gap-3 text-2xl font-black text-ink-900 sm:text-3xl">
          <CloudSun className="h-8 w-8 text-sky-500" aria-hidden="true" />
          KKTC Hava Durumu
        </h1>
        <p className="mt-2 text-sm text-ink-600">
          Anlık ölçümler ve yarının tahmini — veriler 15 dakikada bir güncellenir.
        </p>
      </header>

      <AdSlot placement="under-header" className="mb-6" />

      {!data ? (
        <p className="rounded-xl bg-white p-8 text-center text-ink-500 shadow-sm">
          Hava durumu verisi şu anda alınamıyor. Lütfen birkaç dakika sonra tekrar deneyin.
        </p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {data.cities.map((city) => {
            const tomorrow = describeWeather(city.tomorrowCode);
            return (
              <article
                key={city.city}
                className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-ink-200/70"
              >
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-black text-ink-900">{city.city}</h2>
                  <WeatherIcon code={city.code} className="h-10 w-10" />
                </div>
                <p className="mt-1 text-sm font-semibold text-ink-600">{city.description}</p>
                <p className="mt-3 text-4xl font-black tabular-nums text-ink-900">
                  {city.temperature}°
                </p>
                <p className="mt-1 text-xs font-semibold text-ink-500">
                  Bugün {city.todayMin}° / {city.todayMax}°
                </p>
                <div className="mt-3 grid grid-cols-2 gap-2 border-t border-ink-100 pt-3 text-xs font-semibold text-ink-600">
                  <span className="flex items-center gap-1.5">
                    <Droplets className="h-4 w-4 text-sky-500" aria-hidden="true" />
                    Nem %{city.humidity}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Wind className="h-4 w-4 text-ink-400" aria-hidden="true" />
                    {city.windSpeed} km/s
                  </span>
                </div>
                <p className="mt-3 flex items-center gap-1.5 rounded-lg bg-ink-50 px-3 py-2 text-xs font-semibold text-ink-600">
                  Yarın: <WeatherIcon code={city.tomorrowCode} className="h-4 w-4" />{" "}
                  {tomorrow.description}, {city.tomorrowMin}° / {city.tomorrowMax}°
                </p>
              </article>
            );
          })}
        </div>
      )}

      <p className="mt-8 text-xs text-ink-400">Kaynak: Open-Meteo — canlı meteoroloji modeli verileri.</p>

      <AdSlot placement="footer" className="mt-8" />
    </div>
  );
}
