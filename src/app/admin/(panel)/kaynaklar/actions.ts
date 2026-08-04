"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { assertUser } from "@/lib/admin-guard";
import { slugify } from "@/lib/text";

export type SourceFormState = { error?: string; success?: string };

function parseUrlList(raw: string): string[] {
  return raw
    .split(/[\n,]/)
    .map((line) => line.trim())
    .filter((line) => /^https?:\/\//i.test(line));
}

export async function saveSourceAction(
  _previous: SourceFormState,
  formData: FormData
): Promise<SourceFormState> {
  await assertUser();

  const id = String(formData.get("id") ?? "").trim();
  const name = String(formData.get("name") ?? "").trim();
  const homepage = String(formData.get("homepage") ?? "").trim();
  const mode = String(formData.get("mode") ?? "rss");
  const feedUrl = String(formData.get("feedUrl") ?? "").trim();
  const crawlUrlsRaw = String(formData.get("crawlUrls") ?? "");
  const linkPattern = String(formData.get("linkPattern") ?? "").trim();

  if (name.length < 2) return { error: "Kaynak adı gerekli." };
  if (!/^https?:\/\//i.test(homepage)) return { error: "Geçerli bir site adresi girin." };

  if (mode === "rss" && !/^https?:\/\//i.test(feedUrl)) {
    return { error: "RSS modunda geçerli bir besleme adresi gerekli." };
  }

  const crawlUrls = parseUrlList(crawlUrlsRaw);
  if (mode === "crawl") {
    if (crawlUrls.length === 0) {
      return { error: "Tarama modunda en az bir liste sayfası adresi gerekli." };
    }
    if (!linkPattern) {
      return { error: "Tarama modunda haber bağlantısı deseni gerekli." };
    }
    try {
      new RegExp(linkPattern);
    } catch {
      return { error: "Bağlantı deseni geçerli bir düzenli ifade değil." };
    }
  }

  const data = {
    name,
    homepage,
    mode,
    feedUrl: mode === "rss" ? feedUrl : null,
    crawlUrls: JSON.stringify(crawlUrls),
    linkPattern: mode === "crawl" ? linkPattern : null,
    defaultCategorySlug: String(formData.get("defaultCategorySlug") ?? "kibris"),
    maxPerRun: Math.min(60, Math.max(1, Number(formData.get("maxPerRun")) || 15)),
    priority: Number(formData.get("priority")) || 0,
    isActive: formData.get("isActive") === "on",
    autoPublish: formData.get("autoPublish") === "on",
  };

  if (id) {
    await prisma.source.update({ where: { id }, data });
  } else {
    const slug = slugify(name, 40);
    const existing = await prisma.source.findUnique({ where: { slug } });
    if (existing) return { error: "Bu isimde bir kaynak zaten var." };
    await prisma.source.create({ data: { ...data, slug } });
  }

  revalidatePath("/admin/kaynaklar");
  return { success: "Kaynak kaydedildi." };
}

export async function toggleSourceAction(formData: FormData) {
  await assertUser();

  const id = String(formData.get("id") ?? "");
  const source = await prisma.source.findUnique({ where: { id }, select: { isActive: true } });
  if (!source) return;

  await prisma.source.update({ where: { id }, data: { isActive: !source.isActive } });
  revalidatePath("/admin/kaynaklar");
}

export async function deleteSourceAction(formData: FormData) {
  await assertUser();

  const id = String(formData.get("id") ?? "");
  await prisma.source.delete({ where: { id } });
  revalidatePath("/admin/kaynaklar");
}

/** Tek kaynaktan veya tüm kaynaklardan hemen haber çeker. */
export async function runFetchAction(formData: FormData) {
  await assertUser();

  const sourceSlug = String(formData.get("sourceSlug") ?? "").trim();
  const { runAllSources } = await import("@/lib/scraper");
  await runAllSources(sourceSlug ? { sourceSlug } : {});

  revalidatePath("/admin/kaynaklar");
  revalidatePath("/admin");
  revalidatePath("/admin/haberler");
  revalidatePath("/", "layout");
}
