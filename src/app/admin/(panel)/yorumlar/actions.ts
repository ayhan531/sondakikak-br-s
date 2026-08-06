"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { assertUser } from "@/lib/admin-guard";

async function revalidateArticle(commentId: string) {
  const comment = await prisma.comment.findUnique({
    where: { id: commentId },
    select: { article: { select: { slug: true } } },
  });
  if (comment?.article.slug) revalidatePath(`/haber/${comment.article.slug}`);
}

export async function approveCommentAction(formData: FormData) {
  await assertUser();
  const id = String(formData.get("id") ?? "");

  await prisma.comment.update({ where: { id }, data: { status: "approved" } });
  await revalidateArticle(id);
  revalidatePath("/admin/yorumlar");
}

export async function rejectCommentAction(formData: FormData) {
  await assertUser();
  const id = String(formData.get("id") ?? "");

  await prisma.comment.update({ where: { id }, data: { status: "rejected" } });
  await revalidateArticle(id);
  revalidatePath("/admin/yorumlar");
}

export async function deleteCommentAction(formData: FormData) {
  await assertUser();
  const id = String(formData.get("id") ?? "");

  await revalidateArticle(id);
  await prisma.comment.delete({ where: { id } });
  revalidatePath("/admin/yorumlar");
}
