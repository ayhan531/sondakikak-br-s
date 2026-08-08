/**
 * Canlı döviz ve altın fiyatları.
 * Birincil kaynak: finans.truncgil.com (TCMB tabanlı, değişim yüzdesi ve altın içerir).
 * Yedek kaynak: TCMB günlük kur XML'i (www.tcmb.gov.tr/kurlar/today.xml).
 * Hiçbir koşulda uydurma değer üretilmez; iki kaynak da erişilemezse widget gizlenir.
 */

import { cached } from "./cache";

export type Rate = {
  code: string;
  name: string;
  buying: number;
  selling: number;
  /** Yüzde değişim, ör. 0.18 → %0,18 (yalnızca birincil kaynakta var) */
  change?: number;
};

export type ExchangeData = {
  updatedAt: string;
  source: "truncgil" | "tcmb";
  currencies: Rate[];
  gold: Rate[];
};

const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36";

const CURRENCY_NAMES: Record<string, string> = {
  USD: "Amerikan Doları",
  EUR: "Euro",
  GBP: "İngiliz Sterlini",
  CHF: "İsviçre Frangı",
};

const GOLD_KEYS: Record<string, string> = {
  "gram-altin": "Gram Altın",
  "ceyrek-altin": "Çeyrek Altın",
  "yarim-altin": "Yarım Altın",
  "tam-altin": "Tam Altın",
};

/** "6.659,69" veya "%0,18" biçimindeki Türkçe sayıyı çözer. */
function parseTr(value: unknown): number | null {
  if (typeof value !== "string") return null;
  const cleaned = value.replace(/[^0-9.,-]/g, "").replace(/\./g, "").replace(",", ".");
  const num = Number.parseFloat(cleaned);
  return Number.isFinite(num) ? num : null;
}

async function fromTruncgil(): Promise<ExchangeData | null> {
  const res = await fetch("https://finans.truncgil.com/today.json", {
    headers: { "user-agent": UA, accept: "application/json" },
    signal: AbortSignal.timeout(15_000),

  });
  if (!res.ok) return null;
  const json = (await res.json()) as Record<string, Record<string, string>>;

  const pick = (key: string, name: string): Rate | null => {
    const row = json[key];
    if (!row) return null;
    const buying = parseTr(row["Alış"]);
    const selling = parseTr(row["Satış"]);
    if (buying === null || selling === null) return null;
    const change = parseTr(row["Değişim"]);
    return { code: key.toUpperCase(), name, buying, selling, ...(change !== null ? { change } : {}) };
  };

  const currencies = Object.entries(CURRENCY_NAMES)
    .map(([code, name]) => pick(code, name))
    .filter((rate): rate is Rate => rate !== null);

  const gold = Object.entries(GOLD_KEYS)
    .map(([key, name]) => {
      const rate = pick(key, name);
      return rate ? { ...rate, code: key } : null;
    })
    .filter((rate): rate is Rate => rate !== null);

  if (currencies.length < 3) return null;

  return {
    updatedAt: json.Update_Date?.toString?.() ?? new Date().toISOString(),
    source: "truncgil",
    currencies,
    gold,
  };
}

async function fromTcmb(): Promise<ExchangeData | null> {
  const res = await fetch("https://www.tcmb.gov.tr/kurlar/today.xml", {
    headers: { "user-agent": UA, accept: "application/xml,text/xml,*/*" },
    signal: AbortSignal.timeout(15_000),

  });
  if (!res.ok) return null;
  const xml = await res.text();

  const currencies: Rate[] = [];
  for (const code of Object.keys(CURRENCY_NAMES)) {
    const block = new RegExp(
      `<Currency[^>]+Kod="${code}"[\\s\\S]*?</Currency>`,
      "i"
    ).exec(xml)?.[0];
    if (!block) continue;
    const buying = Number.parseFloat(/<ForexBuying>([\d.]+)<\/ForexBuying>/.exec(block)?.[1] ?? "");
    const selling = Number.parseFloat(/<ForexSelling>([\d.]+)<\/ForexSelling>/.exec(block)?.[1] ?? "");
    if (!Number.isFinite(buying) || !Number.isFinite(selling)) continue;
    currencies.push({ code, name: CURRENCY_NAMES[code], buying, selling });
  }

  if (currencies.length < 3) return null;

  const date = /Tarih="([^"]+)"/.exec(xml)?.[1] ?? "";
  return { updatedAt: date, source: "tcmb", currencies, gold: [] };
}

/** 5 dakikalık önbellekle canlı kurları getirir. */
export async function getExchangeRates(): Promise<ExchangeData | null> {
  return cached("doviz", 5 * 60 * 1000, async () => {
    return (await fromTruncgil().catch(() => null)) ?? (await fromTcmb().catch(() => null));
  });
}
