import "server-only";
import { getSettings } from "@/lib/settings";

/**
 * Yeni içerik yayınlandığında arama motorlarına haber verir.
 *
 * - IndexNow: Bing, Yandex, Seznam vb. anında indeksleme protokolü.
 * - WebSub (PubSubHubbub): RSS beslememizin güncellendiğini Google'ın hub'ına bildirir.
 *
 * Not: Google, sitemap "ping" ucunu 2023'te kapattı; Google tarafı için doğru yol
 * news-sitemap.xml (Search Console'a bir kez eklenir) + WebSub'dur. Googlebot,
 * haber sitemap'lerini zaten dakikalar içinde yeniden tarar.
 */

// IndexNow anahtarı tasarım gereği herkese açıktır; /indexnow-key.txt bunu sunar.
export const INDEXNOW_KEY = "7f3a9c1e5b8d4a6f9e2c7b1a8d5f3e6c";

async function quietFetch(url: string, init?: RequestInit) {
  try {
    await fetch(url, { ...init, signal: AbortSignal.timeout(10_000) });
  } catch {
    // Ping'ler kritik değil; hata yüzünden haber akışını durdurmayız
  }
}

/** Yeni yayınlanan URL'leri arama motorlarına bildirir (beklemeye değmez, await'siz çağrılabilir). */
export async function pingSearchEngines(urls: string[]) {
  if (!urls.length) return;

  const settings = await getSettings();
  const base = settings.siteUrl.replace(/\/$/, "");
  let host: string;
  try {
    host = new URL(base).host;
  } catch {
    return;
  }
  // Yerel geliştirmede dışarıya ping atma
  if (host.includes("localhost") || host.includes("127.0.0.1")) return;

  // IndexNow: toplu bildirim (en fazla 10.000 URL, biz zaten az göndeririz)
  await quietFetch("https://api.indexnow.org/indexnow", {
    method: "POST",
    headers: { "content-type": "application/json; charset=utf-8" },
    body: JSON.stringify({
      host,
      key: INDEXNOW_KEY,
      keyLocation: `${base}/indexnow-key.txt`,
      urlList: urls.slice(0, 500),
    }),
  });

  // WebSub: RSS ve haber sitemap'inin güncellendiğini duyur
  for (const feed of [`${base}/rss.xml`, `${base}/news-sitemap.xml`]) {
    await quietFetch("https://pubsubhubbub.appspot.com/", {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ "hub.mode": "publish", "hub.url": feed }).toString(),
    });
  }
}

/**
 * Düzenli besleme duyurusu: yeni haber olsun olmasın her döngüde (15 dk) çağrılır.
 * Site sürekli güncellendiği için ana sayfa + son haberler + sitemap'ler
 * arama motorlarına "içerik değişti" olarak bildirilir.
 */
export async function pingFeeds() {
  const settings = await getSettings();
  const base = settings.siteUrl.replace(/\/$/, "");
  let host: string;
  try {
    host = new URL(base).host;
  } catch {
    return;
  }
  if (host.includes("localhost") || host.includes("127.0.0.1")) return;

  // IndexNow: sürekli değişen sayfalar (Bing/Yandex anında tarar)
  await quietFetch("https://api.indexnow.org/indexnow", {
    method: "POST",
    headers: { "content-type": "application/json; charset=utf-8" },
    body: JSON.stringify({
      host,
      key: INDEXNOW_KEY,
      keyLocation: `${base}/indexnow-key.txt`,
      urlList: [`${base}/`, `${base}/son-haberler`],
    }),
  });

  // WebSub: Google'ın hub'ına besleme güncellemesi duyur
  for (const feed of [`${base}/rss.xml`, `${base}/news-sitemap.xml`, `${base}/sitemap.xml`]) {
    await quietFetch("https://pubsubhubbub.appspot.com/", {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ "hub.mode": "publish", "hub.url": feed }).toString(),
    });
  }
}
