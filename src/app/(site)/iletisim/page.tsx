import type { Metadata } from "next";
import { getSettings } from "@/lib/settings";
import { ContactForm } from "./ContactForm";

export const metadata: Metadata = {
  title: "İletişim",
  description:
    "Son Dakika Kıbrıs iletişim bilgileri. Haber ihbarı, düzeltme talebi ve iş birliği için bize ulaşın.",
};

export default async function ContactPage() {
  const settings = await getSettings();

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="mb-3 text-3xl font-black text-ink-900">İletişim</h1>
      <p className="mb-8 text-ink-600">
        Haber ihbarı, düzeltme talebi, reklam ve iş birliği için bizimle iletişime geçebilirsiniz.
      </p>

      <div className="grid gap-4 sm:grid-cols-2">
        {settings.contactEmail && (
          <a
            href={`mailto:${settings.contactEmail}`}
            className="rounded-xl bg-white p-6 shadow-sm ring-1 ring-ink-200/70 transition hover:ring-brand-400"
          >
            <p className="text-xs font-bold uppercase tracking-wider text-ink-500">E-posta</p>
            <p className="mt-1 font-bold text-ink-900">{settings.contactEmail}</p>
          </a>
        )}

        {settings.contactPhone && (
          <a
            href={`tel:${settings.contactPhone.replace(/\s/g, "")}`}
            className="rounded-xl bg-white p-6 shadow-sm ring-1 ring-ink-200/70 transition hover:ring-brand-400"
          >
            <p className="text-xs font-bold uppercase tracking-wider text-ink-500">Telefon</p>
            <p className="mt-1 font-bold text-ink-900">{settings.contactPhone}</p>
          </a>
        )}

        {settings.contactAddress && (
          <div className="rounded-xl bg-white p-6 shadow-sm ring-1 ring-ink-200/70 sm:col-span-2">
            <p className="text-xs font-bold uppercase tracking-wider text-ink-500">Adres</p>
            <p className="mt-1 font-bold text-ink-900">{settings.contactAddress}</p>
          </div>
        )}
      </div>

      <div className="mt-8 rounded-xl bg-brand-50 p-6 ring-1 ring-brand-200">
        <h2 className="font-bold text-ink-900">Haber İhbar Hattı</h2>
        <p className="mt-1 text-sm leading-relaxed text-ink-700">
          Gördüğünüz, duyduğunuz veya tanık olduğunuz olayları bize iletin. Kaynağınızın gizliliği
          bizim için esastır.
        </p>
      </div>

      <div className="mt-8 rounded-xl bg-white p-6 shadow-sm ring-1 ring-ink-200/70 sm:p-8">
        <h2 className="mb-1 text-xl font-black text-ink-900">Bize Ulaşın</h2>
        <p className="mb-6 text-sm text-ink-600">
          Formu doldurun, mesajınız doğrudan yayın ekibimize ulaşsın.
        </p>
        <ContactForm />
      </div>
    </div>
  );
}
