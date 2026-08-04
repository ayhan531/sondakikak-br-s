import type { Metadata } from "next";
import { getSettings } from "@/lib/settings";

export const metadata: Metadata = {
  title: "Gizlilik Politikası",
  description: "Son Dakika Kıbrıs gizlilik politikası, çerez kullanımı ve kişisel veri işleme esasları.",
};

export default async function PrivacyPage() {
  const settings = await getSettings();

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="mb-6 text-3xl font-black text-ink-900">Gizlilik Politikası</h1>

      <div className="space-y-6 rounded-xl bg-white p-6 leading-relaxed text-ink-600 shadow-sm ring-1 ring-ink-200/70 sm:p-8">
        <section>
          <h2 className="mb-2 text-lg font-bold text-ink-900">Toplanan Veriler</h2>
          <p>
            {settings.siteName} olarak ziyaretçilerimizden kimlik bilgisi talep etmiyoruz. Yalnızca
            hangi haberlerin ne kadar okunduğunu anlamak için anonim ziyaret istatistikleri
            (sayfa adresi, yönlendiren site, cihaz türü) tutuyoruz.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-lg font-bold text-ink-900">Çerezler</h2>
          <p>
            Sitemiz temel işlevler ve istatistik amacıyla çerez kullanabilir. Tarayıcı ayarlarınızdan
            çerezleri dilediğiniz zaman silebilir veya engelleyebilirsiniz.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-lg font-bold text-ink-900">Reklamlar</h2>
          <p>
            Sitemizde yer alan reklamlar, üçüncü taraf reklam sağlayıcıları aracılığıyla
            gösterilebilir. Bu sağlayıcılar kendi çerez politikalarını uygular.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-lg font-bold text-ink-900">Telif ve İçerik</h2>
          <p>
            Sitemizde yayımlanan haberler, içerik paylaşımı konusunda yazılı anlaşma sağladığımız
            Kıbrıs merkezli haber kuruluşlarından derlenmektedir. Telif hakkı ihlali düşündüğünüz
            bir içerik için bizimle iletişime geçmeniz halinde inceleme yapılır.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-lg font-bold text-ink-900">İletişim</h2>
          <p>
            Gizlilik politikamızla ilgili sorularınız için{" "}
            <a href={`mailto:${settings.contactEmail}`} className="font-semibold text-brand-600 hover:underline">
              {settings.contactEmail}
            </a>{" "}
            adresine yazabilirsiniz.
          </p>
        </section>
      </div>
    </div>
  );
}
