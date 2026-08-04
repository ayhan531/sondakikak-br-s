import Link from "next/link";
import { requireUser } from "@/lib/admin-guard";
import { logoutAction } from "../giris/actions";
import { AdminNav } from "./AdminNav";

export default async function PanelLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();

  return (
    <div className="flex min-h-screen flex-col lg:flex-row">
      <AdminNav userName={user.name} userRole={user.role} logoutAction={logoutAction} />

      <div className="flex-1 lg:pl-64">
        <header className="sticky top-0 z-20 flex h-14 items-center justify-between gap-4 border-b border-ink-200 bg-white px-4 lg:px-8">
          <div className="lg:hidden" />
          <div className="ml-auto flex items-center gap-3">
            <Link
              href="/"
              target="_blank"
              className="rounded-lg px-3 py-1.5 text-xs font-bold text-ink-600 transition hover:bg-ink-100"
            >
              Siteyi Gör ↗
            </Link>
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-600 text-xs font-bold text-white">
                {user.name.slice(0, 1).toLocaleUpperCase("tr-TR")}
              </div>
              <span className="hidden text-sm font-semibold text-ink-800 sm:block">
                {user.name}
              </span>
            </div>
          </div>
        </header>

        <main className="p-4 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
