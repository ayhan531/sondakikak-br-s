"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { assertUser } from "@/lib/admin-guard";
import { ingestUpload } from "@/lib/scraper/image";
import { PLACEMENT_LABELS } from "@/components/ads/AdSlot";

export type AdFormState = { error?: string; success?: string };

function parseDate(value: string): Date | null {
  if (!value.trim()) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

async function readImage(formData: FormData, field: string): Promise<string | null | "invalid"> {
  const file = formData.get(field);
  if (!(file instanceof File) || file.size === 0) return null;
  if (file.size > 5 * 1024 * 1024) return "invalid";

  const buffer = Buffer.from(await file.arrayBuffer());
  return await ingestUpload(buffer, file.name);
}

export async function saveAdAction(
  _previous: AdFormState,
  formData: FormData
): Promise<AdFormState> {
  await assertUser();

  const id = String(formData.get("id") ?? "").trim();
  const name = String(formData.get("name") ?? "").trim();
  const placement = String(formData.get("placement") ?? "");
  const type = String(formData.get("type") ?? "image");

  if (name.length < 2) return { error: "Reklam adı gerekli." };
  if (!(placement in PLACEMENT_LABELS)) return { error: "Geçersiz reklam konumu." };

  const htmlCode = String(formData.get("htmlCode") ?? "").trim();
  const linkUrl = String(formData.get("linkUrl") ?? "").trim();

  if (type === "html" && !htmlCode) {
    return { error: "HTML modunda reklam kodu boş olamaz." };
  }
  if (linkUrl && !/^https?:\/\//i.test(linkUrl)) {
    return { error: "Hedef adres http:// veya https:// ile başlamalı." };
  }

  const desktop = await readImage(formData, "image");
  const mobile = await readImage(formData, "imageMobile");
  if (desktop === "invalid" || mobile === "invalid") {
    return { error: "Görsel 5 MB'den küçük olmalı." };
  }

  const existingImage = String(formData.get("currentImage") ?? "") || null;
  const existingMobile = String(formData.get("currentImageMobile") ?? "") || null;

  const imageUrl = desktop ?? existingImage;
  if (type === "image" && !imageUrl) {
    return { error: "Görsel reklam için bir görsel yükleyin." };
  }

  const data = {
    name,
    placement,
    type,
    htmlCode: type === "html" ? htmlCode : null,
    imageUrl: type === "image" ? imageUrl : null,
    imageUrlMobile: type === "image" ? mobile ?? existingMobile : null,
    linkUrl: linkUrl || null,
    altText: String(formData.get("altText") ?? "").trim() || null,
    isActive: formData.get("isActive") === "on",
    order: Number(formData.get("order")) || 0,
    startsAt: parseDate(String(formData.get("startsAt") ?? "")),
    endsAt: parseDate(String(formData.get("endsAt") ?? "")),
  };

  if (id) {
    await prisma.adSlot.update({ where: { id }, data });
  } else {
    await prisma.adSlot.create({ data });
  }

  revalidatePath("/admin/reklamlar");
  revalidatePath("/", "layout");
  return { success: "Reklam kaydedildi." };
}

export async function toggleAdAction(formData: FormData) {
  await assertUser();

  const id = String(formData.get("id") ?? "");
  const ad = await prisma.adSlot.findUnique({ where: { id }, select: { isActive: true } });
  if (!ad) return;

  await prisma.adSlot.update({ where: { id }, data: { isActive: !ad.isActive } });
  revalidatePath("/admin/reklamlar");
  revalidatePath("/", "layout");
}

export async function deleteAdAction(formData: FormData) {
  await assertUser();

  await prisma.adSlot.delete({ where: { id: String(formData.get("id") ?? "") } });
  revalidatePath("/admin/reklamlar");
  revalidatePath("/", "layout");
}

export async function resetAdStatsAction(formData: FormData) {
  await assertUser();

  await prisma.adSlot.update({
    where: { id: String(formData.get("id") ?? "") },
    data: { impressions: 0, clicks: 0 },
  });
  revalidatePath("/admin/reklamlar");
}
