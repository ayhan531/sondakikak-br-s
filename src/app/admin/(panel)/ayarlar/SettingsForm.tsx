"use client";

import { useActionState } from "react";
import { Card, Field, inputClass, textareaClass } from "@/components/admin/ui";
import {
  changePasswordAction,
  saveSettingsAction,
  type PasswordState,
  type SettingsState,
} from "./actions";
import type { SiteSettings } from "@/lib/settings";

const GROUPS = [
  {
    title: "Site Bilgileri",
    fields: [
      { key: "siteName", label: "Site Adı" },
      { key: "siteTagline", label: "Slogan" },
      { key: "siteUrl", label: "Site Adresi", hint: "https:// ile başlamalı. SEO ve paylaşımlarda kullanılır." },
      { key: "siteDescription", label: "Site Açıklaması", type: "textarea", hint: "Google sonuçlarında görünen açıklama (155 karakter civarı)." },
      { key: "siteKeywords", label: "Anahtar Kelimeler", hint: "Virgülle ayırın." },
      { key: "footerText", label: "Alt Bilgi Metni", type: "textarea" },
    ],
  },
  {
    title: "İletişim",
    fields: [
      { key: "contactEmail", label: "E-posta" },
      { key: "contactPhone", label: "Telefon" },
      { key: "contactAddress", label: "Adres" },
      {
        key: "adsWhatsapp",
        label: "Reklam WhatsApp Numarası",
        hint: "Ülke koduyla, örn: +905391379363. Sitedeki 'Buraya Reklam Verebilirsiniz' banner'ında kullanılır.",
      },
    ],
  },
  {
    title: "Sosyal Medya",
    fields: [
      { key: "facebookUrl", label: "Facebook" },
      { key: "twitterUrl", label: "X (Twitter)" },
      { key: "instagramUrl", label: "Instagram" },
      { key: "youtubeUrl", label: "YouTube" },
      { key: "telegramUrl", label: "Telegram" },
      { key: "whatsappChannel", label: "WhatsApp Kanalı" },
    ],
  },
  {
    title: "Analitik ve Reklam Kodları",
    fields: [
      { key: "googleAnalyticsId", label: "Google Analytics ID", hint: "Örn: G-XXXXXXXXXX" },
      { key: "googleSearchConsole", label: "Search Console Doğrulama Kodu" },
      { key: "googleAdsenseId", label: "AdSense Yayıncı ID", hint: "Örn: ca-pub-1234567890123456" },
      { key: "facebookPixelId", label: "Facebook Pixel ID" },
    ],
  },
  {
    title: "Son Dakika Bandı",
    fields: [{ key: "breakingTickerLabel", label: "Bant Etiketi", hint: 'Örn: "SON DAKİKA"' }],
  },
] as const;

const TOGGLES = [
  { key: "breakingTickerEnabled", label: "Son dakika kayan bandı göster" },
  { key: "autoFetchEnabled", label: "Kaynaklardan otomatik haber çekme açık" },
  { key: "autoPublishFetched", label: "Çekilen haberler otomatik yayınlansın" },
] as const;

const initialSettings: SettingsState = {};
const initialPassword: PasswordState = {};

export function SettingsForm({ settings }: { settings: SiteSettings }) {
  const [state, formAction, pending] = useActionState(saveSettingsAction, initialSettings);

  return (
    <form action={formAction} className="space-y-6">
      {state.error && (
        <p role="alert" className="rounded-lg bg-brand-50 px-4 py-3 text-sm font-medium text-brand-700 ring-1 ring-brand-200">
          {state.error}
        </p>
      )}
      {state.success && (
        <p className="rounded-lg bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700 ring-1 ring-emerald-200">
          {state.success}
        </p>
      )}

      {GROUPS.map((group) => (
        <Card key={group.title} title={group.title}>
          <div className="grid gap-4 p-5 sm:grid-cols-2">
            {group.fields.map((field) => (
              <Field
                key={field.key}
                label={field.label}
                hint={"hint" in field ? field.hint : undefined}
                className={"type" in field && field.type === "textarea" ? "sm:col-span-2" : ""}
              >
                {"type" in field && field.type === "textarea" ? (
                  <textarea
                    name={field.key}
                    rows={3}
                    defaultValue={settings[field.key as keyof SiteSettings]}
                    className={`${textareaClass} min-h-0`}
                  />
                ) : (
                  <input
                    name={field.key}
                    defaultValue={settings[field.key as keyof SiteSettings]}
                    className={inputClass}
                  />
                )}
              </Field>
            ))}
          </div>
        </Card>
      ))}

      <Card title="Görünüm ve Otomasyon">
        <div className="space-y-3 p-5">
          {TOGGLES.map((toggle) => (
            <label key={toggle.key} className="flex items-center gap-2.5 text-sm font-medium text-ink-700">
              <input
                type="checkbox"
                name={toggle.key}
                defaultChecked={settings[toggle.key as keyof SiteSettings] === "true"}
                className="h-4 w-4 rounded border-ink-300 text-brand-600 focus:ring-brand-500"
              />
              {toggle.label}
            </label>
          ))}
        </div>
      </Card>

      <div className="sticky bottom-4">
        <button
          type="submit"
          disabled={pending}
          className="w-full rounded-lg bg-brand-600 py-3 text-sm font-bold text-white shadow-lg transition hover:bg-brand-700 disabled:opacity-60"
        >
          {pending ? "Kaydediliyor…" : "Tüm Ayarları Kaydet"}
        </button>
      </div>
    </form>
  );
}

export function PasswordForm() {
  const [state, formAction, pending] = useActionState(changePasswordAction, initialPassword);

  return (
    <Card title="Şifre Değiştir">
      <form action={formAction} className="space-y-4 p-5">
        {state.error && (
          <p role="alert" className="rounded-lg bg-brand-50 px-3 py-2.5 text-sm font-medium text-brand-700 ring-1 ring-brand-200">
            {state.error}
          </p>
        )}
        {state.success && (
          <p className="rounded-lg bg-emerald-50 px-3 py-2.5 text-sm font-medium text-emerald-700 ring-1 ring-emerald-200">
            {state.success}
          </p>
        )}

        <Field label="Mevcut Şifre">
          <input type="password" name="currentPassword" required autoComplete="current-password" className={inputClass} />
        </Field>
        <Field label="Yeni Şifre" hint="En az 8 karakter.">
          <input type="password" name="newPassword" required minLength={8} autoComplete="new-password" className={inputClass} />
        </Field>
        <Field label="Yeni Şifre (tekrar)">
          <input type="password" name="confirmPassword" required minLength={8} autoComplete="new-password" className={inputClass} />
        </Field>

        <button
          type="submit"
          disabled={pending}
          className="rounded-lg bg-ink-900 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-ink-800 disabled:opacity-60"
        >
          {pending ? "Güncelleniyor…" : "Şifreyi Güncelle"}
        </button>
      </form>
    </Card>
  );
}
