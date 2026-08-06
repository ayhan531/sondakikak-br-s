import { getSettings } from "@/lib/settings";

/**
 * Yeni yayınlanan haberleri bağlı sosyal medya hesaplarında otomatik paylaşır.
 * Her platform kendi ortam değişkenleri tanımlandığında devreye girer:
 *
 * - Telegram kanalı: TELEGRAM_BOT_TOKEN + TELEGRAM_CHANNEL_ID
 *     (@BotFather'dan bot aç, botu kanala yönetici yap, kanal @kullaniciadi'ni gir)
 * - Facebook sayfası: FACEBOOK_PAGE_ID + FACEBOOK_PAGE_TOKEN
 *     (developers.facebook.com'da uygulama + sayfa erişim token'ı)
 * - X (Twitter): X_API_KEY + X_API_SECRET + X_ACCESS_TOKEN + X_ACCESS_SECRET
 * - Instagram: INSTAGRAM_ACCOUNT_ID + FACEBOOK_PAGE_TOKEN (işletme hesabı gerekir)
 *
 * Hiçbiri tanımlı değilse sessizce hiçbir şey yapmaz.
 */

export type ShareArticle = {
  title: string;
  slug: string;
  summary?: string | null;
  imageLocal?: string | null;
};

async function quietFetch(url: string, init?: RequestInit): Promise<Response | null> {
  try {
    return await fetch(url, { ...init, signal: AbortSignal.timeout(15_000) });
  } catch {
    return null;
  }
}

async function postToTelegram(article: ShareArticle, base: string) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const channel = process.env.TELEGRAM_CHANNEL_ID;
  if (!token || !channel) return;

  const url = `${base}/haber/${article.slug}`;
  const text = `📰 <b>${article.title}</b>\n\n${article.summary ?? ""}\n\n👉 ${url}`;

  if (article.imageLocal) {
    await quietFetch(`https://api.telegram.org/bot${token}/sendPhoto`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        chat_id: channel,
        photo: `${base}${article.imageLocal}`,
        caption: text.slice(0, 1024),
        parse_mode: "HTML",
      }),
    });
  } else {
    await quietFetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        chat_id: channel,
        text: text.slice(0, 4096),
        parse_mode: "HTML",
      }),
    });
  }
}

async function postToFacebook(article: ShareArticle, base: string) {
  const pageId = process.env.FACEBOOK_PAGE_ID;
  const token = process.env.FACEBOOK_PAGE_TOKEN;
  if (!pageId || !token) return;

  await quietFetch(`https://graph.facebook.com/v21.0/${pageId}/feed`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      message: `${article.title}\n\n${article.summary ?? ""}`,
      link: `${base}/haber/${article.slug}`,
      access_token: token,
    }),
  });
}

async function postToInstagram(article: ShareArticle, base: string) {
  const accountId = process.env.INSTAGRAM_ACCOUNT_ID;
  const token = process.env.FACEBOOK_PAGE_TOKEN;
  if (!accountId || !token || !article.imageLocal) return;

  // 1) Medya konteyneri oluştur
  const createRes = await quietFetch(
    `https://graph.facebook.com/v21.0/${accountId}/media`,
    {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        image_url: `${base}${article.imageLocal}`,
        caption: `${article.title}\n\nDevamı: ${base}/haber/${article.slug}`,
        access_token: token,
      }),
    }
  );
  const container = createRes ? await createRes.json().catch(() => null) : null;
  if (!container?.id) return;

  // 2) Yayınla
  await quietFetch(`https://graph.facebook.com/v21.0/${accountId}/media_publish`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ creation_id: container.id, access_token: token }),
  });
}

/** Yapılandırılmış tüm platformlarda paylaşır. Hata haber akışını durdurmaz. */
export async function shareToSocial(articles: ShareArticle[]) {
  if (!articles.length) return;

  const settings = await getSettings();
  const base = settings.siteUrl.replace(/\/$/, "");

  // Spam olmasın diye her turda en fazla 5 haber paylaşılır
  for (const article of articles.slice(0, 5)) {
    await Promise.all([
      postToTelegram(article, base),
      postToFacebook(article, base),
      postToInstagram(article, base),
    ]);
  }
}
