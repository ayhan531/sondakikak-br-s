"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { LogoMark } from "@/components/Logo";

const LINKS = [
  { href: "/admin", label: "Genel Bakış", icon: "M4 13h6V4H4v9Zm0 7h6v-5H4v5Zm9 0h7v-9h-7v9Zm0-16v5h7V4h-7Z" },
  { href: "/admin/haberler", label: "Haberler", icon: "M4 5h16v3H4V5Zm0 5h10v9H4v-9Zm12 0h4v4h-4v-4Zm0 5h4v4h-4v-4Z" },
  { href: "/admin/kategoriler", label: "Kategoriler", icon: "M3 5h8v6H3V5Zm10 0h8v6h-8V5ZM3 13h8v6H3v-6Zm10 0h8v6h-8v-6Z" },
  { href: "/admin/kaynaklar", label: "Haber Kaynakları", icon: "M5 4h9l5 5v11a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1Zm8 1.5V10h4.5L13 5.5ZM7 13h10v1.5H7V13Zm0 3.5h7V18H7v-1.5Z" },
  { href: "/admin/reklamlar", label: "Reklamlar", icon: "M3 6h18v12H3V6Zm2 2v8h14V8H5Zm2 2h6v1.5H7V10Zm0 3h10v1.5H7V13Z" },
  { href: "/admin/yorumlar", label: "Yorumlar", icon: "M4 4h16v12H9l-5 4V4Zm3 4h10v1.5H7V8Zm0 3h7v1.5H7V11Z" },
  { href: "/admin/mesajlar", label: "Mesajlar", icon: "M3 5h18v12H8l-5 4V5Zm4 4h10v1.5H7V9Zm0 3h7v1.5H7V12Z" },
  { href: "/admin/istatistikler", label: "İstatistikler", icon: "M4 20h16v1H3V3h1v17Zm2-3V9h3v8H6Zm5 0V5h3v12h-3Zm5 0v-6h3v6h-3Z" },
  { href: "/admin/ayarlar", label: "Ayarlar", icon: "M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8Zm9 4-2-1.2.3-2.3-2.2-.9-1-2.1-2.3.4L12 3l-1.8 1.9-2.3-.4-1 2.1-2.2.9.3 2.3L3 12l2 1.2-.3 2.3 2.2.9 1 2.1 2.3-.4L12 21l1.8-1.9 2.3.4 1-2.1 2.2-.9-.3-2.3L21 12Z" },
] as const;

export function AdminNav({
  userName,
  userRole,
  logoutAction,
}: {
  userName: string;
  userRole: string;
  logoutAction: () => Promise<void>;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const isActive = (href: string) =>
    href === "/admin" ? pathname === "/admin" : pathname.startsWith(href);

  const sidebar = (
    <div className="flex h-full flex-col bg-ink-900">
      <div className="flex items-center gap-2.5 border-b border-ink-800 px-5 py-4">
        <LogoMark className="h-9 w-9" />
        <div>
          <p className="text-sm font-black text-white">
            sondakika<span className="text-brand-500">kıbrıs</span>
          </p>
          <p className="text-[10px] font-semibold uppercase tracking-widest text-ink-500">
            Yönetim
          </p>
        </div>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto p-3">
        {LINKS.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            onClick={() => setOpen(false)}
            aria-current={isActive(link.href) ? "page" : undefined}
            className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold transition ${
              isActive(link.href)
                ? "bg-brand-600 text-white"
                : "text-ink-300 hover:bg-ink-800 hover:text-white"
            }`}
          >
            <svg viewBox="0 0 24 24" className="h-5 w-5 shrink-0" fill="currentColor" aria-hidden="true">
              <path d={link.icon} />
            </svg>
            {link.label}
          </Link>
        ))}
      </nav>

      <div className="border-t border-ink-800 p-3">
        <div className="px-3 pb-2">
          <p className="truncate text-sm font-semibold text-white">{userName}</p>
          <p className="text-[11px] uppercase tracking-wider text-ink-500">
            {userRole === "admin" ? "Yönetici" : "Editör"}
          </p>
        </div>
        <form action={logoutAction}>
          <button
            type="submit"
            className="w-full rounded-lg bg-ink-800 px-3 py-2 text-sm font-semibold text-ink-300 transition hover:bg-brand-600 hover:text-white"
          >
            Çıkış Yap
          </button>
        </form>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobil açma düğmesi */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Menüyü aç"
        className="fixed left-3 top-3 z-30 flex h-9 w-9 items-center justify-center rounded-lg bg-ink-900 text-white lg:hidden"
      >
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" aria-hidden="true">
          <path d="M4 7h16M4 12h16M4 17h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
      </button>

      {/* Masaüstü */}
      <aside className="fixed inset-y-0 left-0 hidden w-64 lg:block">{sidebar}</aside>

      {/* Mobil */}
      {open && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <button
            type="button"
            aria-label="Menüyü kapat"
            onClick={() => setOpen(false)}
            className="absolute inset-0 bg-black/50"
          />
          <aside className="absolute inset-y-0 left-0 w-64">{sidebar}</aside>
        </div>
      )}
    </>
  );
}
