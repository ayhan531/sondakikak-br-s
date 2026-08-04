import Link from "next/link";

/**
 * Marka işareti: kırmızı rozet içinde yayın dalgaları + nokta.
 * "Son dakika" duygusunu veren canlı yayın sembolü.
 */
export function LogoMark({ className = "h-10 w-10" }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" className={className} aria-hidden="true" role="presentation">
      <rect width="48" height="48" rx="11" fill="#dc2626" />
      <rect width="48" height="48" rx="11" fill="url(#sdk-shine)" />
      <circle cx="24" cy="24" r="4.4" fill="#fff" />
      <path
        d="M15.2 15.2a12.4 12.4 0 0 0 0 17.6"
        stroke="#fff"
        strokeWidth="3"
        strokeLinecap="round"
        fill="none"
        opacity="0.95"
      />
      <path
        d="M32.8 15.2a12.4 12.4 0 0 1 0 17.6"
        stroke="#fff"
        strokeWidth="3"
        strokeLinecap="round"
        fill="none"
        opacity="0.95"
      />
      <path
        d="M9.6 9.6a20 20 0 0 0 0 28.8"
        stroke="#fff"
        strokeWidth="2.4"
        strokeLinecap="round"
        fill="none"
        opacity="0.5"
      />
      <path
        d="M38.4 9.6a20 20 0 0 1 0 28.8"
        stroke="#fff"
        strokeWidth="2.4"
        strokeLinecap="round"
        fill="none"
        opacity="0.5"
      />
      <defs>
        <linearGradient id="sdk-shine" x1="0" y1="0" x2="48" y2="48">
          <stop offset="0%" stopColor="#fff" stopOpacity="0.22" />
          <stop offset="60%" stopColor="#fff" stopOpacity="0" />
        </linearGradient>
      </defs>
    </svg>
  );
}

export function Logo({
  className = "",
  compact = false,
}: {
  className?: string;
  compact?: boolean;
}) {
  return (
    <Link
      href="/"
      className={`group flex items-center gap-2.5 ${className}`}
      aria-label="Son Dakika Kıbrıs ana sayfa"
    >
      <LogoMark className={compact ? "h-8 w-8" : "h-11 w-11"} />
      <span className="flex flex-col leading-none">
        <span
          className={`font-black tracking-tight text-ink-900 ${
            compact ? "text-lg" : "text-2xl"
          }`}
        >
          sondakika
          <span className="text-brand-600">kıbrıs</span>
        </span>
        {!compact && (
          <span className="mt-1 text-[10px] font-semibold uppercase tracking-[0.22em] text-ink-500">
            Kıbrıs&apos;ın nabzı
          </span>
        )}
      </span>
    </Link>
  );
}
