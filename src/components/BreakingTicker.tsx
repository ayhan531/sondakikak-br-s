import Link from "next/link";
import { getBreaking } from "@/lib/queries";
import { getSettings, isTrue } from "@/lib/settings";

/**
 * Üst kısımdaki kayan son dakika bandı.
 * Kesintisiz akış için liste iki kez basılır ve %50 kaydırılır.
 */
export async function BreakingTicker() {
  const settings = await getSettings();
  if (!isTrue(settings.breakingTickerEnabled)) return null;

  const items = await getBreaking(10);
  if (items.length === 0) return null;

  const strip = (
    <ul className="flex shrink-0 items-center">
      {items.map((article) => (
        <li key={article.id} className="flex items-center">
          <Link
            href={`/haber/${article.slug}`}
            className="whitespace-nowrap px-4 py-2.5 text-sm font-medium text-white transition hover:text-brand-100"
          >
            {article.title}
          </Link>
          <span className="h-1.5 w-1.5 rounded-full bg-white/40" />
        </li>
      ))}
    </ul>
  );

  return (
    <div className="border-b border-brand-800 bg-brand-700">
      <div className="mx-auto flex max-w-7xl items-stretch">
        <div className="z-10 flex shrink-0 items-center gap-2 bg-ink-900 px-3 sm:px-4">
          <span className="h-2 w-2 animate-pulse-dot rounded-full bg-brand-500" />
          <span className="text-xs font-black uppercase tracking-wider text-white sm:text-sm">
            {settings.breakingTickerLabel}
          </span>
        </div>
        <div className="group relative flex-1 overflow-hidden">
          <div className="flex w-max animate-ticker group-hover:[animation-play-state:paused]">
            {strip}
            {strip}
          </div>
        </div>
      </div>
    </div>
  );
}
