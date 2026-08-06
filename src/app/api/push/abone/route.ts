import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { publicVapidKey, pushConfigured } from "@/lib/push";

export const dynamic = "force-dynamic";

/** VAPID genel anahtarı — istemci aboneliği bununla kurar. */
export async function GET() {
  return NextResponse.json({ ok: pushConfigured(), key: publicVapidKey() });
}

/** Yeni push aboneliği kaydeder. */
export async function POST(request: Request) {
  if (!pushConfigured()) {
    return NextResponse.json({ ok: false, error: "Push yapılandırılmamış" }, { status: 501 });
  }

  try {
    const body = await request.json();
    const endpoint = String(body?.endpoint ?? "");
    const p256dh = String(body?.keys?.p256dh ?? "");
    const auth = String(body?.keys?.auth ?? "");

    if (!endpoint.startsWith("https://") || !p256dh || !auth) {
      return NextResponse.json({ ok: false }, { status: 400 });
    }

    await prisma.pushSubscription.upsert({
      where: { endpoint },
      create: { endpoint, p256dh, auth },
      update: { p256dh, auth, lastError: null },
    });

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }
}

/** Aboneliği kaldırır. */
export async function DELETE(request: Request) {
  try {
    const body = await request.json();
    const endpoint = String(body?.endpoint ?? "");
    if (endpoint) {
      await prisma.pushSubscription.deleteMany({ where: { endpoint } });
    }
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }
}
