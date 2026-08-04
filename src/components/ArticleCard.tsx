import Image from "next/image";
import Link from "next/link";
import { articleImage, type ArticleCardData } from "@/lib/queries";
import { timeAgo } from "@/lib/format";

type Variant = "hero" | "large" | "medium" | "small" | "row" | "rank";

const IMAGE_SIZES: Record<Variant, string> = {
  hero: "(max-width: 1024px) 100vw, 66vw",
  large: "(max-width: 768px) 100vw, 50vw",
  medium: "(max-width: 768px) 100vw, 33vw",
  small: "(max-width: 768px) 50vw, 25vw",
  row: "120px",
  rank: "96px",
};

function CategoryBadge({
  category,
  className = "",
}: {
  category: ArticleCardData["category"];
  className?: string;
}) {
  if (!category) return null;
  return (
    <span
      className={`inline-block rounded px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide text-white ${className}`}
      style={{ backgroundColor: category.color }}
    >
      {category.name}
    </span>
  );
}

function Placeholder({ className = "" }: { className?: string }) {
  return (
    <div
      className={`flex items-center justify-center bg-gradient-to-br from-ink-200 to-ink-300 ${className}`}
    >
      <span className="text-2xl font-black text-ink-400">sdk</span>
    </div>
  );
}

export function ArticleCard({
  article,
  variant = "medium",
  priority = false,
  rank,
}: {
  article: ArticleCardData;
  variant?: Variant;
  priority?: boolean;
  rank?: number;
}) {
  const href = `/haber/${article.slug}`;
  const image = articleImage(article);
  const published = new Date(article.publishedAt);

  // ---------------------------------------------------------------- hero
  if (variant === "hero") {
    return (
      <article className="group relative overflow-hidden rounded-xl bg-ink-900 shadow-lg">
        <Link href={href} className="block">
          <div className="relative aspect-[16/10] w-full sm:aspect-[16/9]">
            {image ? (
              <Image
                src={image}
                alt={article.title}
                fill
                priority={priority}
                sizes={IMAGE_SIZES.hero}
                className="object-cover transition-transform duration-500 group-hover:scale-105"
              />
            ) : (
              <Placeholder className="absolute inset-0" />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />
          </div>

          <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-6">
            <div className="mb-2 flex flex-wrap items-center gap-2">
              {article.isBreaking && (
                <span className="inline-flex items-center gap-1.5 rounded bg-brand-600 px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide text-white">
                  <span className="h-1.5 w-1.5 animate-pulse-dot rounded-full bg-white" />
                  Son Dakika
                </span>
              )}
              <CategoryBadge category={article.category} />
              <span className="text-xs font-medium text-white/70">{timeAgo(published)}</span>
            </div>
            <h2 className="text-xl font-black leading-tight text-white sm:text-3xl md:text-4xl">
              {article.title}
            </h2>
            <p className="mt-2 hidden line-clamp-2 text-sm text-white/80 sm:block sm:text-base">
              {article.summary}
            </p>
          </div>
        </Link>
      </article>
    );
  }

  // ---------------------------------------------------------------- satır
  if (variant === "row") {
    return (
      <article className="group flex gap-3 border-b border-ink-200 pb-3 last:border-0">
        <Link href={href} className="relative h-[70px] w-[105px] shrink-0 overflow-hidden rounded-lg">
          {image ? (
            <Image
              src={image}
              alt={article.title}
              fill
              sizes={IMAGE_SIZES.row}
              className="object-cover transition-transform duration-300 group-hover:scale-105"
            />
          ) : (
            <Placeholder className="h-full w-full" />
          )}
        </Link>
        <div className="min-w-0 flex-1">
          <Link href={href}>
            <h3 className="line-clamp-3 text-sm font-bold leading-snug text-ink-900 transition-colors group-hover:text-brand-600">
              {article.title}
            </h3>
          </Link>
          <div className="mt-1.5 flex items-center gap-2 text-[11px] text-ink-500">
            {article.category && (
              <span className="font-semibold" style={{ color: article.category.color }}>
                {article.category.name}
              </span>
            )}
            <span>{timeAgo(published)}</span>
          </div>
        </div>
      </article>
    );
  }

  // ---------------------------------------------------------------- sıralı liste
  if (variant === "rank") {
    return (
      <article className="group flex items-start gap-3 border-b border-ink-200 pb-3 last:border-0">
        <span className="w-7 shrink-0 text-2xl font-black leading-none text-ink-300">
          {rank}
        </span>
        <div className="min-w-0 flex-1">
          <Link href={href}>
            <h3 className="line-clamp-3 text-sm font-bold leading-snug text-ink-900 transition-colors group-hover:text-brand-600">
              {article.title}
            </h3>
          </Link>
          <div className="mt-1 text-[11px] text-ink-500">{timeAgo(published)}</div>
        </div>
      </article>
    );
  }

  // ---------------------------------------------------------------- kart
  const aspect = variant === "large" ? "aspect-[16/9]" : "aspect-[16/10]";
  const titleSize =
    variant === "large" ? "text-lg sm:text-xl" : variant === "small" ? "text-sm" : "text-base";

  return (
    <article className="group overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-ink-200/70 transition-shadow hover:shadow-md">
      <Link href={href} className="block">
        <div className={`relative w-full ${aspect} overflow-hidden`}>
          {image ? (
            <Image
              src={image}
              alt={article.title}
              fill
              priority={priority}
              sizes={IMAGE_SIZES[variant]}
              className="object-cover transition-transform duration-500 group-hover:scale-105"
            />
          ) : (
            <Placeholder className="absolute inset-0" />
          )}
          {article.category && (
            <div className="absolute left-2.5 top-2.5">
              <CategoryBadge category={article.category} className="shadow" />
            </div>
          )}
          {article.isBreaking && (
            <div className="absolute right-2.5 top-2.5">
              <span className="inline-flex items-center gap-1 rounded bg-brand-600 px-2 py-0.5 text-[10px] font-bold uppercase text-white shadow">
                <span className="h-1.5 w-1.5 animate-pulse-dot rounded-full bg-white" />
                Son Dakika
              </span>
            </div>
          )}
        </div>

        <div className="p-3.5">
          <h3
            className={`line-clamp-3 font-bold leading-snug text-ink-900 transition-colors group-hover:text-brand-600 ${titleSize}`}
          >
            {article.title}
          </h3>
          {variant === "large" && (
            <p className="mt-2 line-clamp-2 text-sm text-ink-600">{article.summary}</p>
          )}
          <div className="mt-2.5 flex items-center gap-2 text-[11px] text-ink-500">
            <span>{timeAgo(published)}</span>
            <span className="text-ink-300">•</span>
            <span>{article.readingTime} dk okuma</span>
          </div>
        </div>
      </Link>
    </article>
  );
}
