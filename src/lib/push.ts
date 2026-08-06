import webpush from "web-push";
import { prisma } from "@/lib/prisma";
import { getSettings } from "@/lib/settings";

/**
 * Web push bildirimleri. VAPID_PUBLIC_KEY ve VAPID_PRIVATE_KEY ortam
 * değişkenleri tanımlıysa çalışır; değilse sessizce devre dışı kalır.
 */

export function pushConfigured(): boolean {
  return Boolean(process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY);
}

export function publicVapidKey(): string {
  return process.env.VAPID_PUBLIC_KEY ?? "";
}

function configure() {
  webpush.setVapidDetails(
    "mailto:info@sondakikakibris.com",
    process.env.VAPID_PUBLIC_KEY!,
    process.env.VAPID_PRIVATE_KEY!
  );
}

export type PushPayload = {
  title: string;
  body: string;
  url: string;
  image?: string;
};

/** Tüm abonelere bildirim gönderir; ölü abonelikleri temizler. */
export async function sendPushToAll(payload: PushPayload) {
  if (!pushConfigured()) return { sent: 0, removed: 0 };
  configure();

  const subscriptions = await prisma.pushSubscription.findMany();
  if (!subscriptions.length) return { sent: 0, removed: 0 };

  const body = JSON.stringify(payload);
  let sent = 0;
  let removed = 0;

  // Aboneleri küçük partiler halinde işle (tek tek beklemek çok yavaş olur)
  const BATCH = 50;
  for (let i = 0; i < subscriptions.length; i += BATCH) {
    const batch = subscriptions.slice(i, i + BATCH);
    await Promise.all(
      batch.map(async (subscription) => {
        try {
          await webpush.sendNotification(
            {
              endpoint: subscription.endpoint,
              keys: { p256dh: subscription.p256dh, auth: subscription.auth },
            },
            body,
            { TTL: 60 * 60 * 6 }
          );
          sent++;
        } catch (error) {
          const status = (error as { statusCode?: number }).statusCode ?? 0;
          // 404/410: abonelik ölmüş, temizle
          if (status === 404 || status === 410) {
            await prisma.pushSubscription
              .delete({ where: { id: subscription.id } })
              .catch(() => {});
            removed++;
          } else {
            await prisma.pushSubscription
              .update({
                where: { id: subscription.id },
                data: { lastError: String(status || (error as Error).message).slice(0, 200) },
              })
              .catch(() => {});
          }
        }
      })
    );
  }

  return { sent, removed };
}

/** Yeni çekilen haberler için bildirim (spam olmasın diye en yeni 3 taneyle sınırlı). */
export async function sendPushForNewArticles(
  articles: { title: string; slug: string; imageLocal?: string | null }[]
) {
  if (!pushConfigured() || !articles.length) return;

  const settings = await getSettings();
  const base = settings.siteUrl.replace(/\/$/, "");

  for (const article of articles.slice(0, 3)) {
    await sendPushToAll({
      title: settings.siteName,
      body: article.title,
      url: `${base}/haber/${article.slug}`,
      image: article.imageLocal ? `${base}${article.imageLocal}` : undefined,
    });
  }
}
