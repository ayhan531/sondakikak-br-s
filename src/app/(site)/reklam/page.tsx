import type { Metadata } from "next";
import { getSettings } from "@/lib/settings";
import { PLACEMENT_LABELS } from "@/components/ads/AdSlot";

export const metadata: Metadata = {
  title: "Reklam Ver",
  description:
    "Son Dakika Kıbrıs'ta reklam verin. Kıbrıs'ın en hızlı büyüyen haber portalında markanızı binlerce okuyucuya ulaştırın.",
};

export default async function AdvertisePage() {
  const settings = await getSettings();

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="mb-3 text-3xl font-black text-ink-900">Reklam Ver</h1>
      <p className="mb-8 leading-relaxed text-ink-600">
        {settings.siteName}, Kıbrıs gündemini takip eden geniş bir okuyucu kitlesine ulaşır.
        Markanızı doğru kitleyle buluşturmak için aşağıdaki reklam alanlarından birini seçebilir
        veya özel bir iş birliği için bize yazabilirsiniz.
      </p>

      <h2 className="mb-3 text-lg font-bold text-ink-900">Reklam Alanlarımız</h2>
      <ul className="mb-8 grid gap-2 sm:grid-cols-2">
        {Object.entries(PLACEMENT_LABELS).map(([key, label]) => (
          <li
            key={key}
            className="rounded-lg bg-white px-4 py-3 text-sm font-medium text-ink-700 shadow-sm ring-1 ring-ink-200/70"
          >
            {label}
          </li>
        ))}
      </ul>

      <div className="rounded-xl bg-ink-900 p-6 text-center sm:p-8">
        <h2 className="text-xl font-bold text-white">Teklif alın</h2>
        <p className="mt-2 text-sm text-ink-300">
          Reklam fiyatlarımız ve kampanya seçenekleri için bize ulaşın.
        </p>
        <a
          href={`mailto:${settings.contactEmail}?subject=Reklam%20Talebi`}
          className="mt-5 inline-block rounded-full bg-brand-600 px-6 py-3 text-sm font-bold text-white transition hover:bg-brand-500"
        >
          {settings.contactEmail}
        </a>
      </div>
    </div>
  );
}
