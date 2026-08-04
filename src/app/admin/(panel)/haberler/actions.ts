"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { assertUser } from "@/lib/admin-guard";
import { cleanArticleHtml } from "@/lib/scraper/clean";
import { ingestUpload } from "@/lib/scraper/image";
import {
  htmlToText,
  makeExcerpt,
  readingTime,
  searchNormalize,
  slugify,
} from "@/lib/text";

export type ArticleFormState = { error?: string; success?: string };

/** Slug çakışmalarını çözer (kendi kaydı hariç). */
async function ensureUniqueSlug(desired: string, currentId?: string): Promise<string> {
  const base = slugify(desired);
  let candidate = base;

  for (let suffix = 2; suffix < 80; suffix++) {
    const existing = await prisma.article.findUnique({
      where: { slug: candidate },
      select: { id: true },
    });
    if (!existing || existing.id === currentId) return candidate;
    candidate = `${base}-${suffix}`;
  }
  return `${base}-${Date.now().toString(36)}`;
}

function checkbox(formData: FormData, name: string): boolean {
  return formData.get(name) === "on" || formData.get(name) === "true";
}

/** Yeni haber ekler veya mevcut haberi günceller. */
export async function saveArticleAction(
  _previous: ArticleFormState,
  formData: FormData
): Promise<ArticleFormState> {
  await assertUser();

  const id = String(formData.get("id") ?? "").trim();
  const title = String(formData.get("title") ?? "").trim();
  const rawContent = String(formData.get("content") ?? "").trim();

  if (title.length < 5) return { error: "Başlık en az 5 karakter olmalı." };
  if (htmlToText(rawContent).length < 50) {
    return { error: "Haber metni çok kısa." };
  }

  // Editörün girdiği HTML de aynı temizleyiciden geçer
  const content = cleanArticleHtml(rawContent, process.env.NEXT_PUBLIC_SITE_URL ?? "https://sondakikakibris.com").html;
  const plain = htmlToText(content);

  const summaryInput = String(formData.get("summary") ?? "").trim();
  const summary = summaryInput || makeExcerpt(plain, 220);

  const categoryId = String(formData.get("categoryId") ?? "") || null;
  const status = String(formData.get("status") ?? "published");
  const publishedAtInput = String(formData.get("publishedAt") ?? "").trim();
  const publishedAt = publishedAtInput ? new Date(publishedAtInput) : new Date();

  const slugInput = String(formData.get("slug") ?? "").trim();
  const slug = await ensureUniqueSlug(slugInput || title, id || undefined);

  // Görsel: yeni yükleme varsa onu kullan
  let imageLocal = String(formData.get("currentImage") ?? "") || null;
  const upload = formData.get("image");
  if (upload instanceof File && upload.size > 0) {
    if (upload.size > 8 * 1024 * 1024) return { error: "Görsel 8 MB'den küçük olmalı." };
    const buffer = Buffer.from(await upload.arrayBuffer());
    const saved = await ingestUpload(buffer, upload.name);
    if (!saved) return { error: "Görsel işlenemedi. Farklı bir dosya deneyin." };
    imageLocal = saved;
  }

  const metaTitle = String(formData.get("metaTitle") ?? "").trim() || title.slice(0, 60);
  const metaDescription =
    String(formData.get("metaDescription") ?? "").trim() || makeExcerpt(plain, 155);
  const keywords = String(formData.get("keywords") ?? "").trim();

  const data = {
    slug,
    title,
    summary,
    content,
    searchText: searchNormalize(`${title} ${summary} ${plain.slice(0, 4000)}`),
    imageLocal,
    imageAlt: String(formData.get("imageAlt") ?? "").trim() || title,
    categoryId,
    status,
    isBreaking: checkbox(formData, "isBreaking"),
    isHeadline: checkbox(formData, "isHeadline"),
    isFeatured: checkbox(formData, "isFeatured"),
    order: Number(formData.get("order") ?? 0) || 0,
    publishedAt: Number.isNaN(publishedAt.getTime()) ? new Date() : publishedAt,
    readingTime: readingTime(plain),
    metaTitle,
    metaDescription,
    keywords,
    author: String(formData.get("author") ?? "").trim() || null,
  };

  if (id) {
    await prisma.article.update({ where: { id }, data });
  } else {
    const created = await prisma.article.create({
      data: { ...data, sourceName: "Son Dakika Kıbrıs" },
    });
    revalidatePath("/", "layout");
    redirect(`/admin/haberler/${created.id}?kayit=tamam`);
  }

  revalidatePath("/", "layout");
  revalidatePath(`/haber/${slug}`);
  return { success: "Haber kaydedildi." };
}

/** Listedeki hızlı işlemler. */
export async function updateArticleFlagAction(formData: FormData) {
  await assertUser();

  const id = String(formData.get("id") ?? "");
  const field = String(formData.get("field") ?? "");
  const value = formData.get("value") === "true";

  const allowed = ["isBreaking", "isHeadline", "isFeatured"] as const;
  if (!allowed.includes(field as (typeof allowed)[number])) return;

  await prisma.article.update({ where: { id }, data: { [field]: value } });
  revalidatePath("/admin/haberler");
  revalidatePath("/", "layout");
}

export async function setArticleStatusAction(formData: FormData) {
  await assertUser();

  const id = String(formData.get("id") ?? "");
  const status = String(formData.get("status") ?? "");
  if (!["published", "draft", "archived"].includes(status)) return;

  await prisma.article.update({ where: { id }, data: { status } });
  revalidatePath("/admin/haberler");
  revalidatePath("/", "layout");
}

export async function deleteArticleAction(formData: FormData) {
  await assertUser();

  const id = String(formData.get("id") ?? "");
  await prisma.article.delete({ where: { id } });

  revalidatePath("/admin/haberler");
  revalidatePath("/", "layout");

  if (formData.get("redirect") === "list") redirect("/admin/haberler?silindi=1");
}

/** Kaynaklardan elle haber çekmeyi başlatır. */
export async function fetchNowAction(formData: FormData) {
  await assertUser();

  const sourceSlug = String(formData.get("sourceSlug") ?? "").trim();
  const { runAllSources } = await import("@/lib/scraper");
  await runAllSources(sourceSlug ? { sourceSlug } : {});

  revalidatePath("/admin");
  revalidatePath("/admin/kaynaklar");
  revalidatePath("/admin/haberler");
  revalidatePath("/", "layout");
}
