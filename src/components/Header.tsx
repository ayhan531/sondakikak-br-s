import Link from "next/link";
import { Logo } from "./Logo";
import { SearchBox } from "./SearchBox";
import { MobileMenu } from "./MobileMenu";
import { getMenuCategories } from "@/lib/queries";
import { getSettings } from "@/lib/settings";
import { formatLongDate } from "@/lib/format";

const SOCIAL = [
  { key: "facebookUrl", label: "Facebook", path: "M13.5 9H16V6h-2.5C11.6 6 10 7.6 10 9.5V11H8v3h2v7h3v-7h2.2l.4-3H13v-1.2c0-.5.2-.8.5-.8Z" },
  { key: "twitterUrl", label: "X", path: "M17.5 4h2.7l-5.9 6.7L21 20h-5.4l-4.2-5.5L6.6 20H3.9l6.3-7.2L3 4h5.5l3.8 5.1L17.5 4Zm-1 14.3h1.5L8.6 5.6H7l8.5 12.7Z" },
  { key: "instagramUrl", label: "Instagram", path: "M12 7.5A4.5 4.5 0 1 0 16.5 12 4.5 4.5 0 0 0 12 7.5Zm0 7.4A2.9 2.9 0 1 1 14.9 12 2.9 2.9 0 0 1 12 14.9ZM17.8 7.3a1 1 0 1 1-1-1 1 1 0 0 1 1 1ZM21 7.3a5.2 5.2 0 0 0-1.4-3.7A5.2 5.2 0 0 0 15.9 2C14.4 2 9.6 2 8.1 2a5.2 5.2 0 0 0-3.7 1.4A5.2 5.2 0 0 0 3 7.1C3 8.6 3 13.4 3 14.9a5.2 5.2 0 0 0 1.4 3.7A5.2 5.2 0 0 0 8.1 20c1.5.1 6.3.1 7.8 0a5.2 5.2 0 0 0 3.7-1.4 5.2 5.2 0 0 0 1.4-3.7c.1-1.5.1-6.3 0-7.6Zm-1.9 9.2a2.9 2.9 0 0 1-1.6 1.6c-1.1.5-3.8.4-5.5.4s-4.4.1-5.5-.4a2.9 2.9 0 0 1-1.6-1.6c-.5-1.1-.4-3.8-.4-5.5s-.1-4.4.4-5.5A2.9 2.9 0 0 1 6.5 4c1.1-.5 3.8-.4 5.5-.4s4.4-.1 5.5.4a2.9 2.9 0 0 1 1.6 1.6c.5 1.1.4 3.8.4 5.5s.1 4.4-.4 5.4Z" },
  { key: "youtubeUrl", label: "YouTube", path: "M21.6 7.2a2.5 2.5 0 0 0-1.8-1.8C18.2 5 12 5 12 5s-6.2 0-7.8.4a2.5 2.5 0 0 0-1.8 1.8A26 26 0 0 0 2 12a26 26 0 0 0 .4 4.8 2.5 2.5 0 0 0 1.8 1.8C5.8 19 12 19 12 19s6.2 0 7.8-.4a2.5 2.5 0 0 0 1.8-1.8A26 26 0 0 0 22 12a26 26 0 0 0-.4-4.8ZM10 15V9l5.2 3Z" },
] as const;

export async function Header() {
  const [categories, settings] = await Promise.all([getMenuCategories(), getSettings()]);

  const socialLinks = SOCIAL.map((item) => ({
    ...item,
    href: settings[item.key],
  })).filter((item) => item.href);

  return (
    <header className="sticky top-0 z-40 bg-white shadow-sm">
      {/* Üst şerit */}
      <div className="hidden bg-ink-900 text-ink-300 md:block">
        <div className="mx-auto flex h-9 max-w-7xl items-center justify-between px-4 text-xs">
          <span className="font-medium">{formatLongDate(new Date())}</span>
          <div className="flex items-center gap-4">
            <Link href="/kunye" className="transition hover:text-white">Künye</Link>
            <Link href="/iletisim" className="transition hover:text-white">İletişim</Link>
            <Link href="/rss.xml" className="transition hover:text-white">RSS</Link>
            {socialLinks.length > 0 && <span className="h-3 w-px bg-ink-700" />}
            <div className="flex items-center gap-2.5">
              {socialLinks.map((item) => (
                <a
                  key={item.key}
                  href={item.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={item.label}
                  className="transition hover:text-white"
                >
                  <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor" aria-hidden="true">
                    <path d={item.path} />
                  </svg>
                </a>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Logo satırı */}
      <div className="border-b border-ink-100">
        <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-3">
          <MobileMenu categories={categories} />
          <Logo />
          <div className="ml-auto hidden w-72 lg:block">
            <SearchBox />
          </div>
        </div>
      </div>

      {/* Kategori menüsü */}
      <nav aria-label="Kategoriler" className="hidden border-b border-ink-200 bg-white lg:block">
        <div className="mx-auto max-w-7xl px-4">
          <ul className="scrollbar-thin flex items-center gap-1 overflow-x-auto">
            <li>
              <Link
                href="/"
                className="block whitespace-nowrap px-3 py-2.5 text-sm font-bold text-ink-900 transition hover:text-brand-600"
              >
                Ana Sayfa
              </Link>
            </li>
            {categories.map((category) => (
              <li key={category.slug}>
                <Link
                  href={`/kategori/${category.slug}`}
                  className="block whitespace-nowrap border-b-2 border-transparent px-3 py-2.5 text-sm font-semibold text-ink-700 transition hover:border-brand-600 hover:text-brand-600"
                >
                  {category.name}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </nav>
    </header>
  );
}
