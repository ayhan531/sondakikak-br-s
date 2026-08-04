"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { assertUser } from "@/lib/admin-guard";
import { slugify } from "@/lib/text";

export type CategoryFormState = { error?: string; success?: string };

export async function saveCategoryAction(
  _previous: CategoryFormState,
  formData: FormData
): Promise<CategoryFormState> {
  await assertUser();

  const id = String(formData.get("id") ?? "").trim();
  const name = String(formData.get("name") ?? "").trim();
  if (name.length < 2) return { error: "Kategori adı gerekli." };

  const slugInput = String(formData.get("slug") ?? "").trim();
  const slug = slugify(slugInput || name, 40);

  const conflict = await prisma.category.findUnique({ where: { slug }, select: { id: true } });
  if (conflict && conflict.id !== id) {
    return { error: "Bu adres (slug) başka bir kategoride kullanılıyor." };
  }

  const data = {
    name,
    slug,
    description: String(formData.get("description") ?? "").trim() || null,
    color: String(formData.get("color") ?? "#dc2626"),
    order: Number(formData.get("order")) || 0,
    isActive: formData.get("isActive") === "on",
    showInMenu: formData.get("showInMenu") === "on",
    metaTitle: String(formData.get("metaTitle") ?? "").trim() || null,
    metaDescription: String(formData.get("metaDescription") ?? "").trim() || null,
  };

  if (id) {
    await prisma.category.update({ where: { id }, data });
  } else {
    await prisma.category.create({ data });
  }

  revalidatePath("/admin/kategoriler");
  revalidatePath("/", "layout");
  return { success: "Kategori kaydedildi." };
}

export async function deleteCategoryAction(formData: FormData) {
  await assertUser();

  const id = String(formData.get("id") ?? "");
  // Haberler silinmez, kategorisiz kalır (şemada onDelete: SetNull)
  await prisma.category.delete({ where: { id } });

  revalidatePath("/admin/kategoriler");
  revalidatePath("/", "layout");
}
