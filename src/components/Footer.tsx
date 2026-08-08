import Link from "next/link";
import { LogoMark } from "./Logo";
import { getAllCategories } from "@/lib/queries";
import { getSettings } from "@/lib/settings";

export async function Footer() {
  const [categories, settings] = await Promise.all([getAllCategories(), getSettings()]);
  const year = new Date().getFullYear();

  return (
    <footer className="mt-10 bg-ink-900 text-ink-300">
      <div className="mx-auto max-w-7xl px-4 py-12">
        <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-4">
          {/* Marka */}
          <div className="lg:col-span-1">
            <div className="flex items-center gap-2.5">
              <LogoMark className="h-10 w-10" />
              <span className="text-xl font-black text-white">
                sondakika<span className="text-brand-500">kıbrıs</span>
              </span>
            </div>
            <p className="mt-4 text-sm leading-relaxed text-ink-400">{settings.footerText}</p>
          </div>

          {/* Kategoriler */}
          <div className="lg:col-span-2">
            <h2 className="mb-4 text-sm font-bold uppercase tracking-wider text-white">
              Kategoriler
            </h2>
            <ul className="grid grid-cols-2 gap-x-4 gap-y-2 sm:grid-cols-3">
              {categories.map((category) => (
                <li key={category.slug}>
                  <Link
                    href={`/kategori/${category.slug}`}
                    className="text-sm text-ink-400 transition hover:text-white"
                  >
                    {category.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Kurumsal */}
          <div>
            <h2 className="mb-4 text-sm font-bold uppercase tracking-wider text-white">Kurumsal</h2>
            <ul className="space-y-2 text-sm">
              <li><Link href="/nobetci-eczaneler" className="text-ink-400 transition hover:text-white">Nöbetçi Eczaneler</Link></li>
              <li><Link href="/doviz-kurlari" className="text-ink-400 transition hover:text-white">Döviz Kurları</Link></li>
              <li><Link href="/hava-durumu" className="text-ink-400 transition hover:text-white">Hava Durumu</Link></li>
              <li><Link href="/kunye" className="text-ink-400 transition hover:text-white">Künye</Link></li>
              <li><Link href="/iletisim" className="text-ink-400 transition hover:text-white">İletişim</Link></li>
              <li><Link href="/gizlilik" className="text-ink-400 transition hover:text-white">Gizlilik Politikası</Link></li>
              <li><Link href="/reklam" className="text-ink-400 transition hover:text-white">Reklam</Link></li>
              <li><Link href="/rss.xml" className="text-ink-400 transition hover:text-white">RSS Beslemesi</Link></li>
              <li><Link href="/sitemap.xml" className="text-ink-400 transition hover:text-white">Site Haritası</Link></li>
            </ul>
            {settings.contactEmail && (
              <a
                href={`mailto:${settings.contactEmail}`}
                className="mt-4 inline-block text-sm font-semibold text-brand-400 transition hover:text-brand-300"
              >
                {settings.contactEmail}
              </a>
            )}
          </div>
        </div>

        <div className="mt-10 flex flex-col items-center justify-between gap-3 border-t border-ink-800 pt-6 text-xs text-ink-500 sm:flex-row">
          <p>© {year} {settings.siteName}. Tüm hakları saklıdır.</p>
          <p>Haberler anlaşmalı kaynaklardan derlenmektedir.</p>
        </div>
      </div>
    </footer>
  );
}
