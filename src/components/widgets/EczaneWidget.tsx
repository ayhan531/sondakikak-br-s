import Link from "next/link";
import { Cross, Phone } from "lucide-react";
import { getDutyPharmacies } from "@/lib/widgets/eczane";

/** Sağ sütun nöbetçi eczane kartı: bölge bölge açılır liste (KTEB canlı listesi). */
export async function EczaneWidget() {
  const data = await getDutyPharmacies();
  if (!data) return null;

  return (
    <section aria-label="Nöbetçi eczaneler" className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-ink-200/70">
      <div className="mb-3 flex items-center justify-between border-b-2 border-ink-900 pb-2">
        <h2 className="flex items-center gap-2 text-base font-black uppercase text-ink-900">
          <Cross className="h-5 w-5 text-brand-600" aria-hidden="true" />
          Nöbetçi Eczaneler
        </h2>
        <Link
          href="/nobetci-eczaneler"
          className="text-xs font-bold uppercase text-ink-500 transition hover:text-brand-600"
        >
          Tümü →
        </Link>
      </div>

      {data.date && <p className="mb-2 text-xs font-semibold text-ink-500">{data.date}</p>}

      <div className="space-y-1">
        {data.regions.map((region, index) => (
          <details key={region.region} open={index === 0} className="group rounded-lg bg-ink-50">
            <summary className="flex cursor-pointer items-center justify-between rounded-lg px-3 py-2 text-xs font-black uppercase text-ink-900 transition hover:text-brand-600">
              {region.region}
              <span className="text-ink-400 transition group-open:rotate-180">▾</span>
            </summary>
            <ul className="space-y-2 px-3 pb-3">
              {region.pharmacies.map((pharmacy) => (
                <li key={pharmacy.name} className="text-xs">
                  <p className="font-bold text-ink-900">{pharmacy.name}</p>
                  {pharmacy.phone && (
                    <a
                      href={`tel:${pharmacy.phone.replace(/[^\d+]/g, "")}`}
                      className="inline-flex items-center gap-1 font-semibold text-brand-600"
                    >
                      <Phone className="h-3 w-3" aria-hidden="true" />
                      {pharmacy.phone}
                    </a>
                  )}
                </li>
              ))}
            </ul>
          </details>
        ))}
      </div>

      <p className="mt-2 text-[10px] text-ink-400">Canlı veri • Kaynak: Kıbrıs Türk Eczacılar Birliği</p>
    </section>
  );
}
