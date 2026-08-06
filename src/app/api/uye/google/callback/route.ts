import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getSettings } from "@/lib/settings";
import { createReaderSession, upsertOAuthReader } from "@/lib/reader-auth";

export const dynamic = "force-dynamic";

/** Google ile giriş — 2. adım: yetki kodunu oturuma çevirir. */
export async function GET(request: Request) {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    return NextResponse.redirect(new URL("/uye/giris", request.url));
  }

  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state") ?? "";

  const store = await cookies();
  const stored = store.get("sdk_oauth_state")?.value ?? "";
  store.delete("sdk_oauth_state");

  const [expectedState, next = "/"] = stored.split(":");
  const settings = await getSettings();
  const base = settings.siteUrl.replace(/\/$/, "");

  if (!code || !state || state !== expectedState) {
    return NextResponse.redirect(`${base}/uye/giris?hata=oauth`);
  }

  try {
    // Kodu access token'a çevir
    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: `${base}/api/uye/google/callback`,
        grant_type: "authorization_code",
      }).toString(),
    });
    const token = await tokenRes.json();
    if (!token.access_token) throw new Error("token alınamadı");

    // Kullanıcı bilgisini al
    const infoRes = await fetch("https://openidconnect.googleapis.com/v1/userinfo", {
      headers: { authorization: `Bearer ${token.access_token}` },
    });
    const info = await infoRes.json();
    if (!info.email) throw new Error("e-posta alınamadı");

    const reader = await upsertOAuthReader({
      provider: "google",
      providerId: String(info.sub ?? ""),
      email: String(info.email),
      name: String(info.name ?? info.given_name ?? ""),
      avatarUrl: typeof info.picture === "string" ? info.picture : undefined,
    });

    await createReaderSession(reader);
    return NextResponse.redirect(`${base}${next.startsWith("/") ? next : "/"}`);
  } catch {
    return NextResponse.redirect(`${base}/uye/giris?hata=oauth`);
  }
}
