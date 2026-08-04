import { NextResponse } from "next/server";
import { recordView } from "@/lib/queries";

function detectDevice(userAgent: string): string {
  if (/tablet|ipad/i.test(userAgent)) return "tablet";
  if (/mobile|android|iphone/i.test(userAgent)) return "mobile";
  return "desktop";
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  let referrer: string | null = null;
  let path = "/";
  try {
    const body = await request.json();
    referrer = typeof body?.referrer === "string" ? body.referrer.slice(0, 300) : null;
    path = typeof body?.path === "string" ? body.path.slice(0, 300) : "/";
  } catch {
    // Gövde okunamazsa varsayılanlarla devam
  }

  try {
    await recordView(id, path, {
      referrer,
      device: detectDevice(request.headers.get("user-agent") ?? ""),
    });
  } catch {
    // Silinmiş haber için sayaç tutmuyoruz
  }

  return new NextResponse(null, { status: 204 });
}
