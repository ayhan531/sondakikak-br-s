/**
 * KKTC nöbetçi eczaneleri.
 * Kaynak: Kıbrıs Türk Eczacılar Birliği resmî listesi (kteb.org/dp) — günlük gerçek liste.
 */

import * as cheerio from "cheerio";
import { fetchText } from "@/lib/scraper/http";
import { cached } from "./cache";

export type Pharmacy = {
  name: string;
  hours: string;
  phone: string;
  address: string;
};

export type PharmacyRegion = {
  region: string;
  pharmacies: Pharmacy[];
};

export type PharmacyData = {
  date: string;
  regions: PharmacyRegion[];
};

/** 30 dakikalık önbellekle günün nöbetçi eczanelerini getirir. */
export async function getDutyPharmacies(): Promise<PharmacyData | null> {
  return cached("eczane", 30 * 60 * 1000, async () => {
    const res = await fetchText("https://kteb.org/dp/?lang=tr", { timeout: 30_000 });
    if (!res.ok) return null;

    const $ = cheerio.load(res.body);
    const regions: PharmacyRegion[] = [];
    let date = "";

    $('div[id^="CpAll_DutyPharmacies_"][id*="pnl"]').each((_, panel) => {
      const $panel = $(panel);

      const regionTitle = $panel
        .find("div")
        .filter((_, el) => /BÖLGESİ/i.test($(el).text()))
        .first()
        .text()
        .replace(/BÖLGESİ/i, "")
        .trim();
      if (!regionTitle) return;

      const pharmacies: Pharmacy[] = [];

      $panel.find("article").each((_, article) => {
        const $article = $(article);
        const $title = $article.find("h1").first();
        // Eczane adı h1 içindeki ilk metin düğümü (altındaki div detay tablosu)
        const name = $title
          .contents()
          .filter((_, node) => node.type === "text")
          .text()
          .replace(/\s+/g, " ")
          .trim();
        if (!name) return;

        const cells = $article
          .find("table tr")
          .map((_, tr) => $(tr).find("td").last().text().replace(/\s+/g, " ").trim())
          .get()
          .filter(Boolean);

        // Satır sırası: tarih, saat, telefon, adres
        const [rowDate = "", hours = "", phone = "", address = ""] = cells;
        if (!date && rowDate) date = rowDate;

        pharmacies.push({
          name,
          hours,
          phone: phone.replace(/\s{2,}/g, " ").trim(),
          address,
        });
      });

      if (pharmacies.length) regions.push({ region: regionTitle, pharmacies });
    });

    if (!regions.length) return null;
    return { date, regions };
  });
}
