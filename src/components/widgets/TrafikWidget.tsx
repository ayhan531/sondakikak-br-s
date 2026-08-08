/** Canlı trafik yoğunluğu bağlantıları (Google Haritalar gerçek zamanlı trafik katmanı). */

const CITIES = [
  { name: "Lefkoşa", lat: 35.185, lon: 33.382 },
  { name: "Girne", lat: 35.341, lon: 33.319 },
  { name: "Gazimağusa", lat: 35.125, lon: 33.941 },
  { name: "Güzelyurt", lat: 35.198, lon: 32.993 },
];

export function TrafikWidget() {
  return (
    <section aria-label="Trafik durumu" className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-ink-200/70">
      <h2 className="mb-3 border-b-2 border-ink-900 pb-2 text-base font-black uppercase text-ink-900">
        🚗 Canlı Trafik
      </h2>
      <div className="grid grid-cols-2 gap-2">
        {CITIES.map((city) => (
          <a
            key={city.name}
            href={`https://www.google.com/maps/@${city.lat},${city.lon},13z/data=!5m1!1e1`}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-lg bg-ink-50 px-3 py-2 text-center text-xs font-bold text-ink-900 transition hover:bg-brand-600 hover:text-white"
          >
            {city.name}
          </a>
        ))}
      </div>
      <p className="mt-2 text-[10px] text-ink-400">Google Haritalar gerçek zamanlı trafik katmanı</p>
    </section>
  );
}
