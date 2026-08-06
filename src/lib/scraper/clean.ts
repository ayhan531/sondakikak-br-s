import * as cheerio from "cheerio";

/**
 * Kaynaktan gelen ham HTML'i yayına hazır hale getirir:
 * reklamları, takip kodlarını, kaynak sitenin kendi tanıtım bloklarını temizler;
 * sınıf/stil kalıntılarını atar; göreli adresleri mutlak yapar.
 */

const REMOVE_SELECTORS = [
  "script",
  "style",
  "noscript",
  "form",
  "input",
  "button",
  "select",
  "audio",
  "video",
  "ins",
  // Haber gövdesinin dışındaki başlık/altbilgi blokları (yayın tarihi, ses oynatıcı, paylaş)
  "hgroup",
  "header",
  "footer",
  "nav",
  "aside",
  "time",
  "iframe:not([src*='youtube']):not([src*='youtu.be']):not([src*='vimeo'])",
  "[id^='ad_']",
  "[id*='google_ads']",
  "[class*='adsbygoogle']",
  "[class*='advert']",
  "[data-advert]",
  "[class*='banner']",
  "[class*='share']",
  "[class*='sosyal']",
  "[class*='social']",
  "[class*='related']",
  "[class*='ilgili']",
  "[class*='comment']",
  "[class*='yorum']",
  "[id*='comment']",
  "[id*='yorum']",
  // Kaynak sitelerin emoji tepki bileşenleri (Mutlu / Alkış / Üzgün / Şaşırmış)
  "[class*='reaction']",
  "[class*='tepki']",
  "[class*='duygu']",
  "[class*='emoji']",
  "[class*='emotion']",
  "[class*='rating']",
  "[class*='vote']",
  "[class*='newsletter']",
  "[class*='breadcrumb']",
  "[class*='tag-list']",
  "[class*='etiket']",
  ".article-source",
  "figure.wp-block-embed",
];

/** Görsel adresi bu desenlere uyuyorsa haber görseli değil, kaynak sitenin reklamıdır. */
const AD_IMAGE_PATTERN =
  /\/(banner|bannerlar|banner2|reklam|reklamlar|advert|adverts|ads?)[\/_-]|[?&](ad|banner)=/i;

/** Kaynak sitelerin gövdeye eklediği tanıtım/arayüz metinleri. */
const BOILERPLATE_PATTERNS: RegExp[] = [
  /YAYIN TARİHİ\s*:?/gi,
  /Haberi dinle/gi,
  /Butona tıklayın\s*:?\s*oynat\s*\/?\s*duraklat/gi,
  /Facebook Paylaşımı/gi,
  /Twitter'?da Paylaş/gi,
  /yazısı ilk önce .* üzerinde ortaya çıktı\.?/gi,
  /\bThe post .* appeared first on .*\.?/gi,
  /Bu haber .* tarafından hazırlanmıştır\.?/gi,
  /Haberin devamı için tıklayın\.?/gi,
  /Devamı için tıklayınız\.?/gi,
  /İlgili haberler?:/gi,
  /Kaynak\s*:\s*[^\n<]{0,60}/gi,
  /Abone ol(un)?\b[^.<]{0,60}\.?/gi,
  /WhatsApp( ihbar)? hattı[^.<]{0,60}\.?/gi,
  /Telegram kanalımıza katıl(ın)?[^.<]{0,60}\.?/gi,
  /Habersiz kalmamak için[^<]{0,90}/gi,
  /Son dakika haberleri için[^<]{0,90}/gi,
  /Bizi (takip edin|sosyal medyada takip edin)[^<]{0,60}/gi,
  /Google (News|Haberler)['’]?[a-zçğıöşü]* (ekleyin|takip edin)[^<]{0,60}/gi,
  /Yorum(lar)?ınızı (bekliyoruz|paylaşın)[^<]{0,60}/gi,
  /Bu habere (tepkiniz|emojiyle tepki ver)[^<]{0,60}/gi,
  /Tepkini(zi)? (göster|bırak)[^<]{0,40}/gi,
  /Yorum [Yy]ap(mak için üye girişi yapın)?\.?/g,
  /Yorum [Yy]az\.?/g,
  /Yorum [Bb]ırak\.?/g,
  /Yorum [Gg]önder\.?/g,
];

/**
 * Kaynak sitelerin tepki/yorum bileşenlerinden geriye kalan tek kelimelik
 * satırlar. Paragrafın TAMAMI bunlardan biriyse (veya yalnız bir sayıysa) atılır.
 */
const JUNK_LINE_WORDS = new Set([
  "mutlu", "alkış", "alkis", "üzgün", "uzgun", "şaşırmış", "sasirmis", "şaşkın",
  "kızgın", "kizgin", "sinirli", "korkmuş", "komik", "beğen", "begen", "beğendim",
  "yorum", "yorumlar", "yorum yap", "yorum yaz", "yorum bırak", "yorum gönder",
  "yorum yapın", "yorumunuz", "paylaş", "paylas", "whatsapp", "facebook", "twitter",
  "telegram", "linkedin", "pinterest", "e-posta", "eposta", "email", "yazdır", "yazdir",
  "tepkiler", "tepkiniz", "tepki ver", "oy ver", "puanla",
]);

export type CleanResult = {
  html: string;
  images: string[];
};

function absolutize(url: string, base: string): string | null {
  try {
    if (!url || url.startsWith("data:")) return null;
    return new URL(url, base).toString();
  } catch {
    return null;
  }
}

export function cleanArticleHtml(rawHtml: string, baseUrl: string): CleanResult {
  if (!rawHtml?.trim()) return { html: "", images: [] };

  const $ = cheerio.load(`<div id="sdk-root">${rawHtml}</div>`, null, false);
  const root = $("#sdk-root");

  root.find(REMOVE_SELECTORS.join(",")).remove();

  // Kaynak siteye giden bağlantıları düz metne çevir (kendi haberimiz gibi yayınlanıyor)
  root.find("a").each((_, el) => {
    const $el = $(el);
    const href = $el.attr("href") ?? "";
    const isInternalAnchor = href.startsWith("#");
    if (isInternalAnchor || !href) {
      $el.replaceWith($el.html() ?? $el.text());
      return;
    }
    // Görsel saran bağlantılarda görseli koru
    if ($el.find("img").length) {
      $el.replaceWith($el.html() ?? "");
      return;
    }
    $el.replaceWith($el.text());
  });

  const images: string[] = [];
  root.find("img").each((_, el) => {
    const $el = $(el);
    const raw =
      $el.attr("src") ||
      $el.attr("data-src") ||
      $el.attr("data-lazy-src") ||
      $el.attr("data-original") ||
      "";
    const abs = absolutize(raw, baseUrl);
    const width = Number($el.attr("width") ?? 0);
    const height = Number($el.attr("height") ?? 0);

    // İzleme pikselleri, ikonlar ve kaynak sitenin reklam banner'ları
    if (
      !abs ||
      (width > 0 && width < 100) ||
      (height > 0 && height < 100) ||
      AD_IMAGE_PATTERN.test(abs) ||
      /\bads?\b/i.test($el.attr("alt") ?? "")
    ) {
      $el.remove();
      return;
    }
    images.push(abs);
    $el.attr("src", abs);
    for (const attr of ["srcset", "sizes", "class", "style", "id", "loading", "decoding", "data-src", "data-lazy-src", "data-original", "fetchpriority", "width", "height"]) {
      $el.removeAttr(attr);
    }
    $el.attr("loading", "lazy");
  });

  // Stil/sınıf kalıntılarını ve script çalıştırabilecek öznitelikleri temizle
  root.find("*").each((_, el) => {
    if (el.type !== "tag") return;
    const $el = $(el);

    for (const attr of Object.keys(el.attribs ?? {})) {
      const name = attr.toLowerCase();
      // onclick, onerror, onload… hiçbiri kalmamalı
      if (name.startsWith("on")) {
        $el.removeAttr(attr);
        continue;
      }
      // javascript:, data: gibi şemalar
      if (name === "src" || name === "href" || name === "xlink:href") {
        const value = ($el.attr(attr) ?? "").trim().toLowerCase();
        if (/^(javascript|vbscript|data):/i.test(value)) $el.removeAttr(attr);
      }
    }

    for (const attr of ["class", "style", "id", "align", "border", "cellpadding", "cellspacing", "bgcolor", "data-channel", "data-advert", "data-rotation", "srcdoc"]) {
      $el.removeAttr(attr);
    }
  });

  // Yalnızca güvenilir video sağlayıcılarına ait iframe'ler kalsın
  root.find("iframe").each((_, el) => {
    const $el = $(el);
    const src = $el.attr("src") ?? "";
    if (!/^https:\/\/(www\.)?(youtube(-nocookie)?\.com|youtu\.be|player\.vimeo\.com)\//i.test(src)) {
      $el.remove();
    }
  });

  // İzin verilmeyen etiketleri içeriğiyle birlikte düzleştir
  const ALLOWED = new Set([
    "p", "br", "strong", "b", "em", "i", "u", "h2", "h3", "h4",
    "ul", "ol", "li", "blockquote", "img", "figure", "figcaption", "iframe",
  ]);
  // Ters belge sırasında ilerliyoruz: alt düğümler üst düğümlerden ÖNCE işlensin.
  // Aksi halde bir <div> değiştirildiğinde içindeki düğümler ağaçtan kopar ve
  // iç içe geçmiş <div>/<article> etiketleri temizlenmeden kalır.
  for (const el of root.find("*").toArray().reverse()) {
    if (el.type !== "tag") continue;
    const tag = el.tagName?.toLowerCase();
    if (!tag || ALLOWED.has(tag)) continue;

    const $el = $(el);
    const inner = $el.html() ?? "";
    // Zaten blok öğe içeriyorsa fazladan <p> ile sarmalamıyoruz
    $el.replaceWith(
      /<(p|h[2-4]|ul|ol|blockquote|figure)[\s>]/i.test(inner) ? inner : `<p>${inner}</p>`
    );
  }

  let html = root.html() ?? "";

  // HTML yorumları: kaynak siteler paylaş bloklarını burada saklı tutuyor
  html = html.replace(/<!--[\s\S]*?-->/g, "");

  for (const pattern of BOILERPLATE_PATTERNS) {
    html = html.replace(pattern, "");
  }

  // Boş paragrafları ve fazla boşlukları at
  const $$ = cheerio.load(`<div id="sdk-root">${html}</div>`, null, false);
  $$("#sdk-root")
    .find("p, div, span, h2, h3, h4")
    .each((_, el) => {
      const $el = $$(el);
      if (!$el.find("img, iframe").length && !$el.text().replace(/ |\s/g, "")) {
        $el.remove();
      }
    });

  const cleaned = $$("#sdk-root");

  // Tek başına kalan tarih satırları, tepki sayaçları ("0") ve
  // tepki/yorum kelimeleri ("Mutlu", "Alkış", "Yorum Yap"…) at
  cleaned.find("p, h2, h3, h4, li").each((_, el) => {
    const $el = $$(el);
    if ($el.find("img, iframe").length) return;
    const text = $el.text().replace(/\s+/g, " ").trim();
    const lower = text.toLocaleLowerCase("tr-TR");
    if (
      /^\d{1,2}[./-]\d{1,2}[./-]\d{2,4}$/.test(text) ||
      /^\d{1,5}$/.test(text) ||
      JUNK_LINE_WORDS.has(lower) ||
      // "0 Mutlu", "12 Alkış" gibi sayı + tepki kelimesi bileşimleri
      /^\d{1,5}\s+(mutlu|alkış|alkis|üzgün|uzgun|şaşırmış|sasirmis|şaşkın|kızgın|kizgin|sinirli|korkmuş|komik|yorum(lar)?)$/.test(lower)
    ) {
      $el.remove();
    }
  });

  // Gövdenin başındaki artık gürültü (reklam görseli yığınları, kısa etiket satırları).
  // Ana görseli ayrıca sakladığımız için baştaki görselleri atmak tekrarı da önler.
  for (const child of cleaned.children().toArray()) {
    const $child = $$(child);
    if ($child.text().replace(/\s+/g, " ").trim().length >= 60) break;
    $child.remove();
  }

  html = (cleaned.html() ?? "")
    .replace(/(\s*<br\s*\/?>\s*){3,}/gi, "<br /><br />")
    .replace(/\s{2,}/g, " ")
    .trim();

  return { html, images };
}

/** "…/upload/news/v2/foto-2026.jpg" -> "foto-2026" */
function imageKey(url: string): string {
  const file = url.split("?")[0].split("/").pop() ?? "";
  return file.replace(/\.[a-z0-9]+$/i, "").toLowerCase();
}

/**
 * Haber sayfaları genellikle spot cümlesini ve ana görseli gövdenin başında
 * bir kez daha tekrarlar. Bunları biz zaten başlığın altında ve kapak görseli
 * olarak gösterdiğimiz için gövdeden çıkarıyoruz.
 */
export function removeDuplicateLead(
  html: string,
  options: {
    description?: string;
    heroImage?: string;
    /**
     * Yalnızca başlık etiketlerini (h2/h3) spot say. Kaydedilmiş haberleri
     * yeniden temizlerken açıklamanın gövdeden türetilmiş olma ihtimali var;
     * bu durumda gerçek ilk paragrafı silmemek için kullanılır.
     */
    headingOnly?: boolean;
  } = {}
): string {
  if (!html) return html;

  const $ = cheerio.load(`<div id="sdk-root">${html}</div>`, null, false);
  const root = $("#sdk-root");

  // Kapak görselinin gövdedeki kopyaları (farklı boyut adresleri de dahil)
  if (options.heroImage) {
    const heroKey = imageKey(options.heroImage);
    if (heroKey.length > 5) {
      root.find("img").each((_, el) => {
        const $el = $(el);
        if (imageKey($el.attr("src") ?? "") === heroKey) $el.remove();
      });
    }
  }

  // Spot cümlesi: yalnızca kaynak sayfadan gelen açıklamayla eşleşiyorsa silinir
  const description = options.description?.replace(/\s+/g, " ").trim();
  if (description && description.length > 40) {
    const head = description.slice(0, 60).toLowerCase();
    for (const child of root.children().toArray().slice(0, 2)) {
      const $child = $(child);
      if (options.headingOnly && !/^h[2-4]$/i.test($child.prop("tagName") ?? "")) continue;

      const text = $child.text().replace(/\s+/g, " ").trim().toLowerCase();
      if (text.length > 30 && (text.startsWith(head) || description.toLowerCase().startsWith(text.slice(0, 60)))) {
        $child.remove();
        break;
      }
    }
  }

  // Görselleri silince boşalan kapları temizle
  root.find("p, figure").each((_, el) => {
    const $el = $(el);
    if (!$el.find("img, iframe").length && !$el.text().trim()) $el.remove();
  });

  return (root.html() ?? "").trim();
}

/**
 * Kıbrıs gazetelerinin çoğu gövdenin ilk satırına muhabir adını büyük harfle
 * yazar ("ERGÜN YAHAT", "Hüseyin ÇİÇEK"). Bunu gövdeden çıkarıp imza alanına taşırız.
 */
export function stripByline(html: string): { html: string; author?: string } {
  if (!html) return { html };

  const $ = cheerio.load(`<div id="sdk-root">${html}</div>`, null, false);
  const first = $("#sdk-root").children().first();
  if (!first.length || first.find("img, iframe").length) return { html };

  const text = first.text().replace(/\s+/g, " ").trim();
  const looksLikeName =
    text.length >= 5 &&
    text.length <= 45 &&
    !/[.:!?]$/.test(text) &&
    text.split(" ").length <= 4 &&
    // En az bir kelime tamamen büyük harf olmalı
    text.split(" ").some((word) => word.length > 2 && word === word.toLocaleUpperCase("tr-TR"));

  if (!looksLikeName) return { html };

  first.remove();
  return { html: ($("#sdk-root").html() ?? "").trim(), author: text };
}
