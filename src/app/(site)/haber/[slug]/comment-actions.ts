"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getCurrentReader } from "@/lib/reader-auth";

export type CommentFormState = { error?: string; success?: string };

const lastComment = new Map<string, number>();
const MIN_INTERVAL_MS = 30_000;

export async function addCommentAction(
  _previous: CommentFormState,
  formData: FormData
): Promise<CommentFormState> {
  const reader = await getCurrentReader();
  if (!reader) return { error: "Yorum yapmak için giriş yapmalısınız." };

  const articleId = String(formData.get("articleId") ?? "");
  const slug = String(formData.get("slug") ?? "");
  const content = String(formData.get("content") ?? "").trim();

  if (content.length < 3) return { error: "Yorumunuz çok kısa." };
  if (content.length > 2000) return { error: "Yorum en fazla 2000 karakter olabilir." };

  const article = await prisma.article.findUnique({
    where: { id: articleId },
    select: { id: true, status: true },
  });
  if (!article || article.status !== "published") return { error: "Haber bulunamadı." };

  const now = Date.now();
  if (now - (lastComment.get(reader.id) ?? 0) < MIN_INTERVAL_MS) {
    return { error: "Çok hızlı yorum yapıyorsunuz. Lütfen biraz bekleyin." };
  }
  lastComment.set(reader.id, now);

  await prisma.comment.create({
    data: { articleId, readerId: reader.id, content },
  });

  if (slug) revalidatePath(`/haber/${slug}`);
  return { success: "Yorumunuz alındı. Onaylandıktan sonra yayınlanacak." };
}
