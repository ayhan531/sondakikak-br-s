import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/** Tıklamayı sayar ve reklam verenin adresine yönlendirir. */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const ad = await prisma.adSlot.findUnique({
    where: { id },
    select: { linkUrl: true },
  });

  if (!ad?.linkUrl) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  await prisma.adSlot.update({
    where: { id },
    data: { clicks: { increment: 1 } },
  });

  return NextResponse.redirect(ad.linkUrl, { status: 302 });
}
