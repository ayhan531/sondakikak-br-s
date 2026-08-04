/**
 * Türkçe metin yardımcıları: slug üretimi, arama normalizasyonu, özet çıkarımı.
 * Türkçe karakterler (ı, İ, ğ, ş, ö, ç, ü) URL ve aramada doğru davranmalı.
 */

const TR_MAP: Record<string, string> = {
  ç: "c", Ç: "c",
  ğ: "g", Ğ: "g",
  ı: "i", I: "i", İ: "i", i: "i",
  ö: "o", Ö: "o",
  ş: "s", Ş: "s",
  ü: "u", Ü: "u",
  â: "a", Â: "a",
  î: "i", Î: "i",
  û: "u", Û: "u",
  "’": "", "'": "", "‘": "", "`": "",
};

/** Türkçe karakterleri ASCII karşılıklarına indirger, küçük harfe çevirir. */
export function foldTurkish(input: string): string {
  let out = "";
  for (const ch of input) {
    out += TR_MAP[ch] ?? ch;
  }
  return out
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase();
}

/** SEO dostu URL parçası üretir: "Girne'de trafik kazası" -> "girnede-trafik-kazasi" */
export function slugify(input: string, maxLength = 90): string {
  const base = foldTurkish(input)
    .replace(/&/g, " ve ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  if (base.length <= maxLength) return base || "haber";

  // Kelime ortasında kesmemek için son tireden kırp
  const cut = base.slice(0, maxLength);
  const lastDash = cut.lastIndexOf("-");
  return (lastDash > 40 ? cut.slice(0, lastDash) : cut).replace(/-+$/, "") || "haber";
}

/** Arama için normalize edilmiş metin (küçük harf, aksansız, tek boşluklu). */
export function searchNormalize(input: string): string {
  return foldTurkish(input).replace(/\s+/g, " ").trim();
}

/** HTML etiketlerini temizleyip düz metin döndürür. */
export function htmlToText(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/(p|div|h[1-6]|li|tr)>/gi, "\n")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&#(\d+);/g, (_, d) => String.fromCharCode(Number(d)))
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

/** Metinden belirli uzunlukta, cümle sonunda biten özet üretir. */
export function makeExcerpt(text: string, maxLength = 200): string {
  const clean = text.replace(/\s+/g, " ").trim();
  if (clean.length <= maxLength) return clean;

  const cut = clean.slice(0, maxLength);
  // Cümle sonu ara
  const sentenceEnd = Math.max(cut.lastIndexOf(". "), cut.lastIndexOf("! "), cut.lastIndexOf("? "));
  if (sentenceEnd > maxLength * 0.5) return cut.slice(0, sentenceEnd + 1);

  const lastSpace = cut.lastIndexOf(" ");
  return (lastSpace > 0 ? cut.slice(0, lastSpace) : cut) + "…";
}

/** Ortalama 200 kelime/dk üzerinden okuma süresi (dakika). */
export function readingTime(text: string): number {
  const words = text.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 200));
}

/** Metinden anahtar kelime adayları çıkarır (basit frekans + durak kelime filtresi). */
const STOPWORDS = new Set(
  ("ve veya ile ama fakat çünkü için gibi kadar sonra önce daha çok az bir bu şu o " +
    "da de ki mi mu mü ise ne her hem yine ancak ayrıca göre üzere olarak olan olarak " +
    "oldu olduğu diye dedi söyledi belirtti ifade var yok tüm bütün ise iken")
    .split(" ")
);

/**
 * Etiket adayları yalnızca özel isimlerden seçilir (kişi, kurum, yer).
 * Aksi halde "adını", "olduğu" gibi sık geçen çekimli kelimeler etiket oluyor.
 * Cümle başındaki büyük harf yanılgısını elemek için kelimenin cümle içinde de
 * büyük harfle geçmiş olması aranır.
 */
export function extractKeywords(text: string, limit = 8): string[] {
  const freq = new Map<string, { word: string; count: number; properHits: number }>();

  // Cümle başlarını işaretleyebilmek için kelimeleri konumlarıyla dolaşıyoruz
  const tokens = [...text.matchAll(/[\p{L}\p{N}]+/gu)];

  for (const [index, match] of tokens.entries()) {
    const raw = match[0];
    if (raw.length < 4) continue;

    const key = foldTurkish(raw);
    if (STOPWORDS.has(key)) continue;
    if (/^\d+$/.test(raw)) continue;

    const first = raw[0];
    const isCapitalized = first === first.toLocaleUpperCase("tr-TR") && first !== first.toLocaleLowerCase("tr-TR");

    // Bir önceki karakter cümle sonu ise bu büyük harf özel isim kanıtı sayılmaz
    const before = text.slice(Math.max(0, match.index - 3), match.index);
    const atSentenceStart = index === 0 || /[.!?:]\s*$/.test(before) || /^\s*$/.test(before);

    const entry = freq.get(key) ?? { word: raw, count: 0, properHits: 0 };
    entry.count++;
    if (isCapitalized) {
      entry.word = raw;
      if (!atSentenceStart) entry.properHits++;
    }
    freq.set(key, entry);
  }

  return [...freq.values()]
    .filter((entry) => entry.properHits > 0)
    .sort((a, b) => b.properHits - a.properHits || b.count - a.count)
    .slice(0, limit)
    .map((entry) => entry.word);
}
