import Link from "next/link";

export function PageHeader({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
      <div>
        <h1 className="text-2xl font-black text-ink-900">{title}</h1>
        {description && <p className="mt-1 text-sm text-ink-500">{description}</p>}
      </div>
      {action}
    </div>
  );
}

export function Card({
  children,
  className = "",
  title,
  action,
}: {
  children: React.ReactNode;
  className?: string;
  title?: string;
  action?: React.ReactNode;
}) {
  return (
    <section className={`rounded-xl bg-white shadow-sm ring-1 ring-ink-200/70 ${className}`}>
      {(title || action) && (
        <div className="flex items-center justify-between gap-3 border-b border-ink-200 px-5 py-3.5">
          {title && <h2 className="text-sm font-bold uppercase tracking-wide text-ink-700">{title}</h2>}
          {action}
        </div>
      )}
      {children}
    </section>
  );
}

export function StatCard({
  label,
  value,
  hint,
  accent = "brand",
}: {
  label: string;
  value: string | number;
  hint?: string;
  accent?: "brand" | "green" | "blue" | "amber";
}) {
  const accents = {
    brand: "text-brand-600",
    green: "text-emerald-600",
    blue: "text-sky-600",
    amber: "text-amber-600",
  } as const;

  return (
    <div className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-ink-200/70">
      <p className="text-xs font-bold uppercase tracking-wider text-ink-500">{label}</p>
      <p className={`mt-2 text-3xl font-black ${accents[accent]}`}>{value}</p>
      {hint && <p className="mt-1 text-xs text-ink-400">{hint}</p>}
    </div>
  );
}

export function Button({
  children,
  href,
  type = "button",
  variant = "primary",
  size = "md",
  className = "",
  ...props
}: {
  children: React.ReactNode;
  href?: string;
  type?: "button" | "submit";
  variant?: "primary" | "secondary" | "danger" | "ghost";
  size?: "sm" | "md";
  className?: string;
} & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  const variants = {
    primary: "bg-brand-600 text-white hover:bg-brand-700",
    secondary: "bg-ink-900 text-white hover:bg-ink-800",
    danger: "bg-white text-brand-700 ring-1 ring-brand-300 hover:bg-brand-50",
    ghost: "bg-ink-100 text-ink-700 hover:bg-ink-200",
  } as const;

  const sizes = { sm: "px-3 py-1.5 text-xs", md: "px-4 py-2.5 text-sm" } as const;
  const classes = `inline-flex items-center justify-center gap-1.5 rounded-lg font-bold transition disabled:opacity-60 ${variants[variant]} ${sizes[size]} ${className}`;

  if (href) {
    return (
      <Link href={href} className={classes}>
        {children}
      </Link>
    );
  }

  return (
    <button type={type} className={classes} {...props}>
      {children}
    </button>
  );
}

export function Badge({
  children,
  tone = "gray",
}: {
  children: React.ReactNode;
  tone?: "gray" | "green" | "red" | "amber" | "blue";
}) {
  const tones = {
    gray: "bg-ink-100 text-ink-600",
    green: "bg-emerald-100 text-emerald-700",
    red: "bg-brand-100 text-brand-700",
    amber: "bg-amber-100 text-amber-700",
    blue: "bg-sky-100 text-sky-700",
  } as const;

  return (
    <span className={`inline-block rounded px-2 py-0.5 text-[11px] font-bold ${tones[tone]}`}>
      {children}
    </span>
  );
}

export function Field({
  label,
  children,
  hint,
  className = "",
}: {
  label: string;
  children: React.ReactNode;
  hint?: string;
  className?: string;
}) {
  return (
    <div className={className}>
      <label className="mb-1.5 block text-sm font-semibold text-ink-700">{label}</label>
      {children}
      {hint && <p className="mt-1 text-xs text-ink-400">{hint}</p>}
    </div>
  );
}

export const inputClass =
  "w-full rounded-lg border border-ink-200 px-3 py-2.5 text-sm text-ink-900 outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-100";

export const selectClass = inputClass;
export const textareaClass = `${inputClass} min-h-32 resize-y`;

export function EmptyState({ message, action }: { message: string; action?: React.ReactNode }) {
  return (
    <div className="px-5 py-12 text-center">
      <p className="text-sm text-ink-500">{message}</p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
