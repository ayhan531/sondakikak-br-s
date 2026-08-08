import type { Metadata } from "next";
import { getDutyPharmacies } from "@/lib/widgets/eczane";
import { AdSlot } from "@/components/ads/AdSlot";

// Canlı KTEB listesi her istekte (bellek önbelleğiyle) sunulur
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "KKTC Nöbetçi Eczaneler — Bugün Açık Eczaneler",
  description:
    "Lefkoşa, Girne, Gazimağusa, Güzelyurt, İskele ve tüm KKTC bölgelerindeki bugünün nöbetçi eczaneleri. Adres ve telefon bilgileriyle güncel liste.",
  alternates: { canonical: "https://sondakikakibris.com/nobetci-eczaneler" },
};

export default async function NobetciEczanelerPage() {
  const data = await getDutyPharmacies();

  return (
    <div className="mx-auto max-w-7xl px-4 py-6">
      <header className="mb-6">
        <h1 className="text-2xl font-black text-ink-900 sm:text-3xl">💊 Nöbetçi Eczaneler</h1>
        <p className="mt-2 text-sm text-ink-600">
          {data?.date ? `${data.date} tarihli` : "Bugünün"} KKTC nöbetçi eczane listesi. Veriler
          Kıbrıs Türk Eczacılar Birliği&apos;nin resmî listesinden canlı olarak alınır.
        </p>
      </header>

      <AdSlot placement="under-header" className="mb-6" />

      {!data ? (
        <p className="rounded-xl bg-white p-8 text-center text-ink-500 shadow-sm">
          Liste şu anda alınamıyor. Lütfen birkaç dakika sonra tekrar deneyin veya{" "}
          <a href="https://kteb.org/dp/?lang=tr" className="font-bold text-brand-600" target="_blank" rel="noopener noreferrer">
            KTEB sitesini
          </a>{" "}
          ziyaret edin.
        </p>
      ) : (
        <div className="space-y-8">
          {data.regions.map((region) => (
            <section key={region.region} aria-label={region.region}>
              <h2 className="mb-3 border-b-2 border-brand-600 pb-2 text-lg font-black uppercase text-ink-900">
                {region.region}
              </h2>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {region.pharmacies.map((pharmacy) => (
                  <article
                    key={pharmacy.name}
                    className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-ink-200/70"
                  >
                    <h3 className="text-sm font-black text-ink-900">{pharmacy.name}</h3>
                    {pharmacy.hours && (
                      <p className="mt-1 text-xs font-semibold text-ink-600">🕐 {pharmacy.hours}</p>
                    )}
                    {pharmacy.phone && (
                      <p className="mt-1 text-xs">
                        <a
                          href={`tel:${pharmacy.phone.replace(/[^\d+]/g, "")}`}
                          className="font-bold text-brand-600"
                        >
                          📞 {pharmacy.phone}
                        </a>
                      </p>
                    )}
                    {pharmacy.address && (
                      <p className="mt-1 text-xs text-ink-500">📍 {pharmacy.address}</p>
                    )}
                  </article>
                ))}
              </div>
            </section>
          ))}
        </div>
      )}

      <p className="mt-8 text-xs text-ink-400">
        Kaynak:{" "}
        <a href="https://kteb.org" target="_blank" rel="noopener noreferrer" className="underline">
          Kıbrıs Türk Eczacılar Birliği
        </a>{" "}
        — liste her gün otomatik güncellenir.
      </p>

      <AdSlot placement="footer" className="mt-8" />
    </div>
  );
}
