"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function SearchBox({
  className = "",
  placeholder = "Haberlerde ara…",
  autoFocus = false,
  defaultValue = "",
}: {
  className?: string;
  placeholder?: string;
  autoFocus?: boolean;
  defaultValue?: string;
}) {
  const router = useRouter();
  const [value, setValue] = useState(defaultValue);

  return (
    <form
      role="search"
      onSubmit={(event) => {
        event.preventDefault();
        const query = value.trim();
        if (query.length < 2) return;
        router.push(`/arama?q=${encodeURIComponent(query)}`);
      }}
      className={`relative ${className}`}
    >
      <input
        type="search"
        name="q"
        value={value}
        autoFocus={autoFocus}
        onChange={(event) => setValue(event.target.value)}
        placeholder={placeholder}
        aria-label="Haberlerde ara"
        className="w-full rounded-full border border-ink-200 bg-ink-50 py-2 pl-4 pr-11 text-sm text-ink-900 outline-none transition focus:border-brand-500 focus:bg-white focus:ring-2 focus:ring-brand-100"
      />
      <button
        type="submit"
        aria-label="Ara"
        className="absolute right-1 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-brand-600 text-white transition hover:bg-brand-700"
      >
        <svg viewBox="0 0 20 20" fill="none" className="h-4 w-4" aria-hidden="true">
          <circle cx="9" cy="9" r="6" stroke="currentColor" strokeWidth="2" />
          <path d="m13.5 13.5 3.5 3.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
      </button>
    </form>
  );
}
