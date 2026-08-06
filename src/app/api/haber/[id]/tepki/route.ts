import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { randomBytes } from "node:crypto";
import { prisma } from "@/lib/prisma";
import { getCurrentReader } from "@/lib/reader-auth";
import { REACTION_TYPES } from "@/lib/reactions";

export const dynamic = "force-dynamic";

async function getCounts(articleId: string) {
  const rows = await prisma.reaction.groupBy({
    by: ["type"],
    where: { articleId },
    _count: { type: true },
  });
  const counts: Record<string, number> = {};
  for (const type of REACTION_TYPES) counts[type] = 0;
  for (const row of rows) counts[row.type] = row._count.type;
  return counts;
}

/** Tepki bırak / değiştir. Giriş gerektirmez; anonim çerez kimliğiyle tekilleştirilir. */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  let type: string;
  try {
    type = String((await request.json()).type ?? "");
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }
  if (!REACTION_TYPES.includes(type as (typeof REACTION_TYPES)[number])) {
    return NextResponse.json({ ok: false, error: "Geçersiz tepki" }, { status: 400 });
  }

  const article = await prisma.article.findUnique({
    where: { id },
    select: { id: true, status: true },
  });
  if (!article || article.status !== "published") {
    return NextResponse.json({ ok: false }, { status: 404 });
  }

  const store = await cookies();
  let anonId = store.get("sdk_tepki")?.value ?? "";
  if (!anonId || anonId.length < 16) {
    anonId = randomBytes(16).toString("hex");
    store.set("sdk_tepki", anonId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 365,
    });
  }

  const reader = await getCurrentReader();

  const existing = await prisma.reaction.findUnique({
    where: { articleId_anonId: { articleId: id, anonId } },
  });

  let myReaction: string | null;
  if (existing && existing.type === type) {
    // Aynı tepkiye tekrar basınca geri çekilir
    await prisma.reaction.delete({ where: { id: existing.id } });
    myReaction = null;
  } else {
    await prisma.reaction.upsert({
      where: { articleId_anonId: { articleId: id, anonId } },
      create: { articleId: id, anonId, type, readerId: reader?.id ?? null },
      update: { type, readerId: reader?.id ?? null },
    });
    myReaction = type;
  }

  return NextResponse.json({ ok: true, counts: await getCounts(id), myReaction });
}

/** Mevcut tepki sayılarını ve bu ziyaretçinin tepkisini döndürür. */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const store = await cookies();
  const anonId = store.get("sdk_tepki")?.value ?? "";

  const mine = anonId
    ? await prisma.reaction.findUnique({
        where: { articleId_anonId: { articleId: id, anonId } },
        select: { type: true },
      })
    : null;

  return NextResponse.json({ ok: true, counts: await getCounts(id), myReaction: mine?.type ?? null });
}
