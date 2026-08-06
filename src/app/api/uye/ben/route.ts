import { NextResponse } from "next/server";
import { getCurrentReader } from "@/lib/reader-auth";

export const dynamic = "force-dynamic";

/** Oturumdaki okuru döndürür (istemci bileşenleri için). */
export async function GET() {
  const reader = await getCurrentReader();
  return NextResponse.json({
    ok: true,
    reader: reader ? { name: reader.name } : null,
  });
}
