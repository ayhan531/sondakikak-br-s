import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { randomBytes } from "node:crypto";
import { getSettings } from "@/lib/settings";

export const dynamic = "force-dynamic";

/**
 * Google ile giriş — 1. adım: kullanıcıyı Google onay ekranına yönlendirir.
 * GOOGLE_CLIENT_ID ve GOOGLE_CLIENT_SECRET tanımlıysa çalışır.
 */
export async function GET(request: Request) {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  if (!clientId) {
    return NextResponse.json({ error: "Google girişi yapılandırılmamış" }, { status: 501 });
  }

  const url = new URL(request.url);
  const next = url.searchParams.get("next") ?? "/";

  const settings = await getSettings();
  const base = settings.siteUrl.replace(/\/$/, "");

  const state = randomBytes(16).toString("hex");
  const store = await cookies();
  store.set("sdk_oauth_state", `${state}:${next.startsWith("/") ? next : "/"}`, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 600,
  });

  const authorize = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  authorize.searchParams.set("client_id", clientId);
  authorize.searchParams.set("redirect_uri", `${base}/api/uye/google/callback`);
  authorize.searchParams.set("response_type", "code");
  authorize.searchParams.set("scope", "openid email profile");
  authorize.searchParams.set("state", state);
  authorize.searchParams.set("prompt", "select_account");

  return NextResponse.redirect(authorize.toString());
}
