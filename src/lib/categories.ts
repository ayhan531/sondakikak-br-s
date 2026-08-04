import { foldTurkish } from "@/lib/text";

/** Sitenin sabit kategori listesi. Sıra menüde göründüğü sıradır. */
export const CATEGORY_SEED = [
  { slug: "kibris", name: "Kıbrıs", color: "#dc2626", description: "KKTC ve Kıbrıs geneli son dakika haberleri" },
  { slug: "siyaset", name: "Siyaset", color: "#1d4ed8", description: "Kıbrıs siyaseti, meclis, partiler ve müzakere süreci" },
  { slug: "ekonomi", name: "Ekonomi", color: "#059669", description: "Döviz, asgari ücret, enflasyon ve iş dünyası" },
  { slug: "asayis", name: "Asayiş", color: "#b91c1c", description: "Polis, mahkeme, trafik ve adli haberler" },
  { slug: "spor", name: "Spor", color: "#ea580c", description: "Futbol, basketbol ve Kıbrıs sporundan son gelişmeler" },
  { slug: "guney-kibris", name: "Güney Kıbrıs", color: "#7c3aed", description: "Rum kesimi ve Rum basınından haberler" },
  { slug: "turkiye", name: "Türkiye", color: "#e11d48", description: "Türkiye gündemi" },
  { slug: "dunya", name: "Dünya", color: "#0284c7", description: "Dünyadan son dakika haberleri" },
  { slug: "saglik", name: "Sağlık", color: "#0d9488", description: "Sağlık, hastane ve yaşam kalitesi haberleri" },
  { slug: "egitim", name: "Eğitim", color: "#4f46e5", description: "Okullar, üniversiteler ve sınavlar" },
  { slug: "kultur-sanat", name: "Kültür Sanat", color: "#9333ea", description: "Sergi, tiyatro, sinema ve edebiyat" },
  { slug: "magazin", name: "Magazin", color: "#db2777", description: "Magazin ve ünlüler dünyası" },
  { slug: "teknoloji", name: "Teknoloji", color: "#475569", description: "Teknoloji, bilim ve dijital dünya" },
  { slug: "yasam", name: "Yaşam", color: "#65a30d", description: "Yaşam, seyahat, gastronomi ve çevre" },
] as const;

export type CategorySlug = (typeof CATEGORY_SEED)[number]["slug"];

/**
 * Kaynak sitedeki kategori adını / bölüm ipucunu bizim kategorilerimize eşler.
 * Sıra önemli: daha spesifik kurallar üstte.
 */
const RULES: Array<{ category: CategorySlug; keywords: string[] }> = [
  { category: "guney-kibris", keywords: ["guney kibris", "rum basini", "rum kesimi", "guney", "kathimerini", "fileleftheros", "politis"] },
  { category: "asayis", keywords: ["asayis", "adli", "polis", "mahkeme", "kaza", "yangin", "cinayet", "uyusturucu", "trafik", "3.sayfa", "3. sayfa", "guvenlik", "tutuklan", "tutuklu", "gozalt", "sorusturma", "carpti", "carpisti", "yarali", "hirsizlik", "kacakcilik", "kacak", "bicakli saldiri", "silahli saldiri", "ehliyetsiz", "alkoll", "dava", "sanik", "zanli", "hapis", "para cezasi", "yargi", "savci", "gumruksuz", "dolandiric", "operasyon"] },
  { category: "siyaset", keywords: ["siyaset", "politika", "meclis", "hukumet", "secim", "muzakere", "kibris sorunu", "cumhurbaskani", "basbakan", "parti"] },
  { category: "ekonomi", keywords: ["ekonomi", "finans", "doviz", "borsa", "is dunyasi", "sektor", "emlak", "asgari ucret", "turizm"] },
  { category: "spor", keywords: ["spor", "futbol", "basketbol", "voleybol", "lig", "transfer", "olimpiyat"] },
  { category: "saglik", keywords: ["saglik", "hastane", "doktor", "tip", "salgin", "asi"] },
  { category: "egitim", keywords: ["egitim", "okul", "universite", "ogrenci", "sinav", "ogretmen"] },
  { category: "kultur-sanat", keywords: ["kultur", "sanat", "sinema", "tiyatro", "muzik", "kitap", "edebiyat", "festival", "sergi"] },
  { category: "magazin", keywords: ["magazin", "celebrity", "unlu", "moda", "dizi"] },
  { category: "teknoloji", keywords: ["teknoloji", "bilim", "dijital", "yapay zeka", "otomobil", "oyun", "sosyal medya", "internet"] },
  { category: "turkiye", keywords: ["turkiye", "ankara", "istanbul", "anadolu"] },
  { category: "dunya", keywords: ["dunya", "global", "ingiltere", "avrupa", "abd", "dis haberler"] },
  { category: "yasam", keywords: ["yasam", "hayat", "cevre", "doga", "gurme", "seyahat", "gezi", "tatil", "kadin", "eglence"] },
  { category: "kibris", keywords: ["kibris", "kktc", "lefkosa", "girne", "gazimagusa", "magusa", "iskele", "guzelyurt", "lefke", "yerel", "gundem", "haberler", "manset", "ozel haber"] },
];

/**
 * Verilen ipuçlarına bakarak kategori seçer.
 *
 * İpuçları güven sırasına göre verilmelidir (önce kaynağın kendi kategorisi,
 * en sonda başlık). Daha güvenilir ipucu eşleşirse başlıktaki rastgele bir
 * kelimenin kategoriyi kaçırması engellenir — örneğin trafik kazası haberinde
 * geçen "hastane" kelimesi haberi Sağlık'a düşürmesin diye.
 */
export function matchCategory(hints: (string | undefined | null)[], fallback = "kibris"): string {
  const haystacks = hints
    .filter((hint): hint is string => Boolean(hint && hint.trim()))
    .map((hint) => foldTurkish(hint));

  for (const haystack of haystacks) {
    for (const { category, keywords } of RULES) {
      if (keywords.some((keyword) => haystack.includes(keyword))) return category;
    }
  }
  return fallback;
}
