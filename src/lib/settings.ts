import { prisma } from "@/lib/prisma";
import { cache } from "react";

/** Admin panelinden düzenlenebilen tüm site ayarları ve varsayılan değerleri. */
export const DEFAULT_SETTINGS = {
  siteName: "Son Dakika Kıbrıs",
  siteTagline: "Kıbrıs'ın en hızlı haber kaynağı",
  siteDescription:
    "Kıbrıs son dakika haberleri, KKTC gündemi, siyaset, ekonomi, spor ve yaşam. Kıbrıs'ta olan biteni ilk siz öğrenin.",
  siteUrl: process.env.NEXT_PUBLIC_SITE_URL || "https://sondakikakibris.com",
  siteKeywords:
    "kıbrıs haber, son dakika kıbrıs, kktc haberleri, lefkoşa, girne, gazimağusa, kıbrıs gündem, kıbrıs son dakika",

  contactEmail: "info@sondakikakibris.com",
  contactPhone: "",
  contactAddress: "Lefkoşa, Kuzey Kıbrıs",
  adsWhatsapp: "",

  facebookUrl: "",
  twitterUrl: "",
  instagramUrl: "",
  youtubeUrl: "",
  telegramUrl: "",
  whatsappChannel: "",

  googleAnalyticsId: "",
  googleSearchConsole: "",
  googleAdsenseId: "",
  facebookPixelId: "",

  breakingTickerEnabled: "true",
  breakingTickerLabel: "SON DAKİKA",

  autoFetchEnabled: "true",
  autoPublishFetched: "true",
  footerText:
    "Son Dakika Kıbrıs, Kıbrıs ve KKTC gündemini 7/24 takip eden bağımsız haber portalıdır.",
} as const;

export type SettingKey = keyof typeof DEFAULT_SETTINGS;
export type SiteSettings = Record<SettingKey, string>;

/** Tüm ayarları getirir; DB'de olmayanlar için varsayılanı kullanır. */
export const getSettings = cache(async (): Promise<SiteSettings> => {
  const result = { ...DEFAULT_SETTINGS } as SiteSettings;
  try {
    const rows = await prisma.setting.findMany();
    for (const row of rows) {
      if (row.key in result) result[row.key as SettingKey] = row.value;
    }
  } catch {
    // Veritabanı henüz hazır değilse varsayılanlarla devam et (ilk build sırasında olabilir)
  }
  return result;
});

/** Tek bir ayarı okur. */
export async function getSetting(key: SettingKey): Promise<string> {
  const settings = await getSettings();
  return settings[key];
}

/** Ayarları toplu günceller. */
export async function saveSettings(values: Partial<Record<SettingKey, string>>) {
  const entries = Object.entries(values).filter(([key]) => key in DEFAULT_SETTINGS);
  await Promise.all(
    entries.map(([key, value]) =>
      prisma.setting.upsert({
        where: { key },
        create: { key, value: String(value ?? "") },
        update: { value: String(value ?? "") },
      })
    )
  );
}

export function isTrue(value: string | undefined): boolean {
  return value === "true" || value === "1" || value === "on";
}
