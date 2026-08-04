import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/** Reklam gösterim sayacı — reklam ekranda göründüğünde bir kez çağrılır. */
export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    await prisma.adSlot.update({
      where: { id },
      data: { impressions: { increment: 1 } },
    });
  } catch {
    // Silinmiş reklam için sayaç tutmaya gerek yok
  }
  return new NextResponse(null, { status: 204 });
}
