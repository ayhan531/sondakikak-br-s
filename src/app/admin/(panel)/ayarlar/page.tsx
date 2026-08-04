import { PageHeader } from "@/components/admin/ui";
import { getSettings } from "@/lib/settings";
import { PasswordForm, SettingsForm } from "./SettingsForm";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const settings = await getSettings();

  return (
    <>
      <PageHeader
        title="Ayarlar"
        description="Site bilgileri, iletişim, sosyal medya ve analitik kodları"
      />

      <div className="grid gap-6 xl:grid-cols-3">
        <div className="xl:col-span-2">
          <SettingsForm settings={settings} />
        </div>
        <div className="space-y-6">
          <PasswordForm />

          <div className="rounded-xl bg-sky-50 p-5 text-sm text-sky-900 ring-1 ring-sky-200">
            <p className="font-bold">Zamanlanmış görev adresi</p>
            <p className="mt-1.5 leading-relaxed">
              Otomatik haber çekimi için sunucudaki cron görevi şu adresi çağırmalıdır:
            </p>
            <code className="mt-2 block break-all rounded bg-sky-100 px-2 py-1.5 text-xs">
              {settings.siteUrl}/api/cron/haber-cek
            </code>
            <p className="mt-2 text-xs">
              İstek başlığında <code className="rounded bg-sky-100 px-1">Authorization: Bearer CRON_SECRET</code>{" "}
              gönderilmelidir. CRON_SECRET değeri sunucu ortam değişkenlerinde tanımlıdır.
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
