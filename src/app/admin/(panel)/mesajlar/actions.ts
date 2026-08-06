"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { assertUser } from "@/lib/admin-guard";

export async function toggleMessageReadAction(formData: FormData) {
  await assertUser();

  const id = String(formData.get("id") ?? "");
  const message = await prisma.contactMessage.findUnique({ where: { id }, select: { isRead: true } });
  if (!message) return;

  await prisma.contactMessage.update({
    where: { id },
    data: { isRead: !message.isRead },
  });

  revalidatePath("/admin/mesajlar");
}

export async function deleteMessageAction(formData: FormData) {
  await assertUser();

  const id = String(formData.get("id") ?? "");
  await prisma.contactMessage.delete({ where: { id } });

  revalidatePath("/admin/mesajlar");
}
