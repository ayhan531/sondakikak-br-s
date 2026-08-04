import type { Metadata } from "next";
import { getSettings } from "@/lib/settings";

export const metadata: Metadata = {
  title: "Künye",
  description: "Son Dakika Kıbrıs künye bilgileri, yayın ilkeleri ve iletişim.",
};

export default async function ImprintPage() {
  const settings = await getSettings();

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="mb-6 text-3xl font-black text-ink-900">Künye</h1>

      <div className="space-y-6 rounded-xl bg-white p-6 shadow-sm ring-1 ring-ink-200/70 sm:p-8">
        <section>
          <h2 className="mb-2 text-lg font-bold text-ink-900">Yayın Adı</h2>
          <p className="text-ink-600">{settings.siteName}</p>
        </section>

        <section>
          <h2 className="mb-2 text-lg font-bold text-ink-900">Hakkımızda</h2>
          <p className="leading-relaxed text-ink-600">{settings.footerText}</p>
        </section>

        <section>
          <h2 className="mb-2 text-lg font-bold text-ink-900">Yayın İlkelerimiz</h2>
          <ul className="list-disc space-y-1.5 pl-5 leading-relaxed text-ink-600">
            <li>Haberlerimizi doğruluk ve tarafsızlık ilkesiyle sunarız.</li>
            <li>Kişilik haklarına ve özel hayatın gizliliğine saygı gösteririz.</li>
            <li>Hatalı yayınları tespit edildiği anda düzeltir, düzeltmeyi görünür kılarız.</li>
            <li>Reklam ve haber içeriğini birbirinden açıkça ayırırız.</li>
            <li>
              Sitemizdeki haberler, içerik paylaşımı konusunda anlaşma sağladığımız Kıbrıs
              merkezli haber kuruluşlarından derlenmektedir.
            </li>
          </ul>
        </section>

        <section>
          <h2 className="mb-2 text-lg font-bold text-ink-900">İletişim</h2>
          <ul className="space-y-1 text-ink-600">
            {settings.contactEmail && (
              <li>
                E-posta:{" "}
                <a href={`mailto:${settings.contactEmail}`} className="font-semibold text-brand-600 hover:underline">
                  {settings.contactEmail}
                </a>
              </li>
            )}
            {settings.contactPhone && <li>Telefon: {settings.contactPhone}</li>}
            {settings.contactAddress && <li>Adres: {settings.contactAddress}</li>}
          </ul>
        </section>
      </div>
    </div>
  );
}
