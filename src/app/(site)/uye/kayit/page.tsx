import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentReader } from "@/lib/reader-auth";
import { RegisterForm } from "../AuthForms";

export const metadata: Metadata = {
  title: "Üye Ol",
  robots: { index: false },
};

export default async function ReaderRegisterPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next = "/" } = await searchParams;
  const reader = await getCurrentReader();
  const safeNext =
    next.startsWith("/") && !next.startsWith("//") && !next.startsWith("/\\") ? next : "/";
  if (reader) redirect(safeNext);

  return (
    <div className="mx-auto max-w-md px-4 py-12">
      <div className="rounded-xl bg-white p-6 shadow-sm ring-1 ring-ink-200/70 sm:p-8">
        <h1 className="mb-1 text-2xl font-black text-ink-900">Üye Ol</h1>
        <p className="mb-6 text-sm text-ink-500">
          Ücretsiz hesap oluşturun; haberlere yorum yapın, tartışmalara katılın.
        </p>
        <RegisterForm next={next} googleEnabled={Boolean(process.env.GOOGLE_CLIENT_ID)} />
      </div>
    </div>
  );
}
