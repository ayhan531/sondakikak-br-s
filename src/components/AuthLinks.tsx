"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type Me = { name: string } | null;

/**
 * Header'daki üyelik alanı. Sayfalar önbelleklendiği (ISR) için oturum
 * istemci tarafında /api/uye/ben üzerinden okunur.
 */
export function AuthLinks() {
  const [me, setMe] = useState<Me>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    fetch("/api/uye/ben")
      .then((res) => res.json())
      .then((json) => setMe(json.reader ?? null))
      .catch(() => setMe(null))
      .finally(() => setLoaded(true));
  }, []);

  if (!loaded) return <div className="h-8 w-24" aria-hidden="true" />;

  if (me) {
    return (
      <span className="flex items-center gap-1.5 rounded-full bg-ink-100 px-3 py-1.5 text-xs font-bold text-ink-900">
        <span aria-hidden="true">👤</span>
        <span className="max-w-28 truncate">{me.name}</span>
      </span>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <Link
        href="/uye/giris"
        className="rounded-full border border-ink-200 px-3 py-1.5 text-xs font-bold text-ink-900 transition hover:border-brand-600 hover:text-brand-600"
      >
        Giriş Yap
      </Link>
      <Link
        href="/uye/kayit"
        className="hidden rounded-full bg-brand-600 px-3 py-1.5 text-xs font-bold text-white transition hover:bg-brand-700 sm:block"
      >
        Kayıt Ol
      </Link>
    </div>
  );
}
