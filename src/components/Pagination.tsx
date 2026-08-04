import Link from "next/link";

/** Sayfa numaraları — SEO için gerçek <a> bağlantıları kullanır. */
export function Pagination({
  page,
  totalPages,
  basePath,
  query = "",
}: {
  page: number;
  totalPages: number;
  basePath: string;
  query?: string;
}) {
  if (totalPages <= 1) return null;

  const href = (target: number) =>
    `${basePath}?${query ? `${query}&` : ""}sayfa=${target}`;

  const windowStart = Math.max(1, Math.min(page - 2, totalPages - 4));
  const windowEnd = Math.min(totalPages, windowStart + 4);
  const pages = Array.from({ length: windowEnd - windowStart + 1 }, (_, i) => windowStart + i);

  return (
    <nav aria-label="Sayfalama" className="mt-8 flex flex-wrap items-center justify-center gap-2">
      {page > 1 && (
        <Link
          href={href(page - 1)}
          rel="prev"
          className="rounded-lg bg-white px-4 py-2 text-sm font-bold text-ink-700 shadow-sm ring-1 ring-ink-200 transition hover:bg-ink-900 hover:text-white"
        >
          ← Önceki
        </Link>
      )}

      {pages.map((target) => (
        <Link
          key={target}
          href={href(target)}
          aria-current={target === page ? "page" : undefined}
          className={`min-w-10 rounded-lg px-3.5 py-2 text-center text-sm font-bold shadow-sm ring-1 transition ${
            target === page
              ? "bg-brand-600 text-white ring-brand-600"
              : "bg-white text-ink-700 ring-ink-200 hover:bg-ink-900 hover:text-white"
          }`}
        >
          {target}
        </Link>
      ))}

      {page < totalPages && (
        <Link
          href={href(page + 1)}
          rel="next"
          className="rounded-lg bg-white px-4 py-2 text-sm font-bold text-ink-700 shadow-sm ring-1 ring-ink-200 transition hover:bg-ink-900 hover:text-white"
        >
          Sonraki →
        </Link>
      )}
    </nav>
  );
}
