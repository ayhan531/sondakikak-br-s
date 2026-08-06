"use server";

import { prisma } from "@/lib/prisma";

export type ContactFormState = { error?: string; success?: string };

/** Aynı IP'den gelen istekleri kabaca sınırlamak için (süreç içi, yeniden başlatmada sıfırlanır). */
const lastSubmission = new Map<string, number>();
const MIN_INTERVAL_MS = 60_000;

export async function sendContactMessageAction(
  _previous: ContactFormState,
  formData: FormData
): Promise<ContactFormState> {
  // Bal küpü: botlar bu gizli alanı doldurur, insanlar görmez
  if (String(formData.get("website") ?? "")) {
    return { success: "Mesajınız alındı. En kısa sürede dönüş yapacağız." };
  }

  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim();
  const subject = String(formData.get("subject") ?? "").trim();
  const message = String(formData.get("message") ?? "").trim();

  if (name.length < 2) return { error: "Lütfen adınızı yazın." };
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) {
    return { error: "Geçerli bir e-posta adresi girin." };
  }
  if (message.length < 10) return { error: "Mesajınız çok kısa. Lütfen biraz daha detay verin." };
  if (message.length > 5000) return { error: "Mesaj çok uzun (en fazla 5000 karakter)." };

  // Basit istek sınırı: aynı e-posta 1 dakikada bir mesaj gönderebilir
  const now = Date.now();
  const previous = lastSubmission.get(email.toLowerCase()) ?? 0;
  if (now - previous < MIN_INTERVAL_MS) {
    return { error: "Çok sık mesaj gönderiyorsunuz. Lütfen biraz bekleyip tekrar deneyin." };
  }
  lastSubmission.set(email.toLowerCase(), now);

  await prisma.contactMessage.create({
    data: {
      name: name.slice(0, 120),
      email: email.slice(0, 200),
      phone: phone.slice(0, 40) || null,
      subject: subject.slice(0, 200) || null,
      message,
    },
  });

  return { success: "Mesajınız alındı. En kısa sürede dönüş yapacağız." };
}
