import { NextResponse } from "next/server";
import { timingSafeEqual } from "node:crypto";
import { runAllSources } from "@/lib/scraper";
import { getSettings, isTrue } from "@/lib/settings";

// Çekim işlemi uzun sürebilir, statik üretime kapalı olmalı
export const dynamic = "force-dynamic";
export const maxDuration = 300;

/** Uzunluk sızdırmayan, sabit zamanlı karşılaştırma. */
function secretMatches(provided: string, expected: string): boolean {
  const a = Buffer.from(provided);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

/**
 * Zamanlanmış haber çekme.
 * Render Cron Job şu adresi çağırır:
 *   curl -H "Authorization: Bearer $CRON_SECRET" https://site/api/cron/haber-cek
 *
 * Sır yalnızca Authorization başlığıyla kabul edilir. Sorgu dizesiyle
 * (?secret=...) gönderilmesine izin vermiyoruz: o değer sunucu erişim
 * kayıtlarına, yönlendiren başlıklarına ve tarayıcı geçmişine düşer.
 */
async function handle(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    return NextResponse.json(
      { ok: false, error: "CRON_SECRET tanımlı değil" },
      { status: 500 }
    );
  }

  const header = request.headers.get("authorization") ?? "";
  const provided = header.replace(/^Bearer\s+/i, "").trim();

  if (!secretMatches(provided, secret)) {
    return NextResponse.json({ ok: false, error: "Yetkisiz" }, { status: 401 });
  }

  const url = new URL(request.url);

  const settings = await getSettings();
  if (!isTrue(settings.autoFetchEnabled)) {
    return NextResponse.json({ ok: true, skipped: "Otomatik çekim ayarlardan kapatılmış" });
  }

  const sourceSlug = url.searchParams.get("kaynak") ?? undefined;
  const summary = await runAllSources(sourceSlug ? { sourceSlug } : {});

  return NextResponse.json({ ok: true, ...summary });
}

export async function GET(request: Request) {
  return handle(request);
}

export async function POST(request: Request) {
  return handle(request);
}
