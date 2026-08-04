/**
 * Anlaşmalı haber kaynakları.
 * mode = "rss"   -> feedUrl üzerinden besleme okunur
 * mode = "crawl" -> crawlUrls listesindeki sayfalardan haber bağlantıları toplanır
 */

export type SourceSeed = {
  slug: string;
  name: string;
  homepage: string;
  mode: "rss" | "crawl";
  feedUrl?: string;
  crawlUrls?: string[];
  /** crawl modunda haber bağlantısını tanımak için desen (string olarak saklanır) */
  linkPattern?: string;
  defaultCategorySlug: string;
  maxPerRun: number;
  priority: number;
};

export const SOURCE_SEED: SourceSeed[] = [
  {
    slug: "haberkibris",
    name: "Haber Kıbrıs",
    homepage: "https://haberkibris.com",
    mode: "rss",
    feedUrl: "https://haberkibris.com/rss.php",
    defaultCategorySlug: "kibris",
    maxPerRun: 20,
    priority: 90,
  },
  {
    slug: "kibrispostasi",
    name: "Kıbrıs Postası",
    homepage: "https://www.kibrispostasi.com",
    mode: "crawl",
    crawlUrls: [
      "https://www.kibrispostasi.com/c35-KIBRIS_HABERLERI",
      "https://www.kibrispostasi.com/c57-Adli_Haberler",
      "https://www.kibrispostasi.com/c50-EKONOMI",
      "https://www.kibrispostasi.com/c41-SPOR",
      "https://www.kibrispostasi.com/c58-GUNEY_KIBRIS",
      "https://www.kibrispostasi.com/c36-TURKIYE",
      "https://www.kibrispostasi.com/c37-DUNYA",
      "https://www.kibrispostasi.com/c91-EGITIM",
      "https://www.kibrispostasi.com/c77-SAGLIK",
      "https://www.kibrispostasi.com/c49-KULTUR-SANAT",
    ],
    linkPattern: "kibrispostasi\\.com/c\\d+-[^/]+/n\\d+-",
    defaultCategorySlug: "kibris",
    maxPerRun: 20,
    priority: 95,
  },
  {
    slug: "kibrisgazetesi",
    name: "Kıbrıs Gazetesi",
    homepage: "https://kibrisgazetesi.com",
    mode: "rss",
    feedUrl: "https://kibrisgazetesi.com/feed/",
    defaultCategorySlug: "kibris",
    maxPerRun: 15,
    priority: 80,
  },
  {
    slug: "yeniduzen",
    name: "Yenidüzen",
    homepage: "https://www.yeniduzen.com",
    mode: "rss",
    feedUrl: "https://www.yeniduzen.com/rss",
    defaultCategorySlug: "kibris",
    maxPerRun: 20,
    priority: 85,
  },
  {
    slug: "ozgurgazete",
    name: "Özgür Gazete Kıbrıs",
    homepage: "https://ozgurgazetekibris.com",
    mode: "rss",
    feedUrl: "https://ozgurgazetekibris.com/feed",
    defaultCategorySlug: "kibris",
    maxPerRun: 15,
    priority: 70,
  },
  {
    slug: "gundemkibris",
    name: "Gündem Kıbrıs",
    homepage: "https://www.gundemkibris.com",
    mode: "rss",
    feedUrl: "https://www.gundemkibris.com/rss",
    defaultCategorySlug: "kibris",
    maxPerRun: 20,
    priority: 85,
  },
  {
    slug: "bagimsiz",
    name: "Bağımsız",
    homepage: "https://www.bagimsiz.com",
    mode: "rss",
    feedUrl: "https://www.bagimsiz.com/rss",
    defaultCategorySlug: "kibris",
    maxPerRun: 20,
    priority: 75,
  },
  {
    slug: "bugunkibris",
    name: "Bugün Kıbrıs",
    homepage: "https://bugunkibris.com",
    mode: "rss",
    feedUrl: "https://bugunkibris.com/feed/",
    defaultCategorySlug: "kibris",
    maxPerRun: 15,
    priority: 70,
  },
  {
    slug: "diyalog",
    name: "Diyalog Gazetesi",
    homepage: "https://www.diyaloggazetesi.com",
    mode: "rss",
    feedUrl: "https://www.diyaloggazetesi.com/rss",
    defaultCategorySlug: "kibris",
    maxPerRun: 20,
    priority: 75,
  },
  {
    slug: "kibrisgercek",
    name: "Kıbrıs Gerçek",
    homepage: "https://www.kibrisgercek.com",
    mode: "rss",
    feedUrl: "https://www.kibrisgercek.com/rss",
    defaultCategorySlug: "kibris",
    maxPerRun: 20,
    priority: 75,
  },
];
