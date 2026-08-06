import { NextResponse } from "next/server";
import { timingSafeEqual } from "node:crypto";

/** Uzunluk sızdırmayan, sabit zamanlı karşılaştırma. */
function secretMatches(provided: string, expected: string): boolean {
  const a = Buffer.from(provided);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

/**
 * Cron uçları için ortak yetki denetimi. Sır yalnızca Authorization
 * başlığıyla kabul edilir (sorgu dizesi log'lara düşer).
 * Yetkiliyse null, değilse hazır hata yanıtı döner.
 */
export function requireCronSecret(request: Request): NextResponse | null {
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
  return null;
}
