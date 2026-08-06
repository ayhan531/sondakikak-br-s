import "server-only";
import bcrypt from "bcryptjs";
import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { cache } from "react";
import { prisma } from "@/lib/prisma";

/** Okur (üye) oturumu — yönetici oturumundan (sdk_session) tamamen ayrıdır. */

const COOKIE_NAME = "sdk_okur";
const MAX_AGE_SECONDS = 60 * 60 * 24 * 90; // 90 gün

export type SessionReader = {
  id: string;
  email: string;
  name: string;
};

function secretKey(): Uint8Array {
  const secret = process.env.AUTH_SECRET;
  if (!secret || secret.length < 16) {
    throw new Error("AUTH_SECRET tanımlı değil veya çok kısa.");
  }
  // Yönetici oturumlarıyla aynı anahtar kullanılmasın diye türetiyoruz
  return new TextEncoder().encode(`okur:${secret}`);
}

export async function createReaderSession(reader: SessionReader) {
  const token = await new SignJWT({ ...reader })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${MAX_AGE_SECONDS}s`)
    .sign(secretKey());

  const store = await cookies();
  store.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: MAX_AGE_SECONDS,
  });
}

export async function destroyReaderSession() {
  const store = await cookies();
  store.delete(COOKIE_NAME);
}

/** Geçerli oturumdaki okuru döndürür, yoksa null. */
export const getCurrentReader = cache(async (): Promise<SessionReader | null> => {
  try {
    const store = await cookies();
    const token = store.get(COOKIE_NAME)?.value;
    if (!token) return null;

    const { payload } = await jwtVerify(token, secretKey());
    if (!payload.id || typeof payload.id !== "string") return null;

    return {
      id: payload.id,
      email: String(payload.email ?? ""),
      name: String(payload.name ?? ""),
    };
  } catch {
    return null;
  }
});

export async function registerReader(name: string, email: string, password: string) {
  const normalized = email.trim().toLowerCase();
  const existing = await prisma.reader.findUnique({ where: { email: normalized } });
  if (existing) return { error: "Bu e-posta ile zaten bir hesap var. Giriş yapmayı deneyin." };

  const reader = await prisma.reader.create({
    data: {
      name: name.trim().slice(0, 80),
      email: normalized,
      password: await bcrypt.hash(password, 12),
      provider: "email",
    },
  });

  return { reader: { id: reader.id, email: reader.email, name: reader.name } };
}

export async function authenticateReader(email: string, password: string) {
  const reader = await prisma.reader.findUnique({
    where: { email: email.trim().toLowerCase() },
  });
  if (!reader || !reader.isActive || !reader.password) return null;

  const ok = await bcrypt.compare(password, reader.password);
  if (!ok) return null;

  await prisma.reader.update({ where: { id: reader.id }, data: { lastLogin: new Date() } });
  return { id: reader.id, email: reader.email, name: reader.name };
}

/**
 * OAuth ile gelen okuru bulur veya oluşturur (Google vb.).
 * Aynı e-posta ile şifreli hesap varsa hesaplar birleştirilir.
 */
export async function upsertOAuthReader(input: {
  provider: string;
  providerId: string;
  email: string;
  name: string;
  avatarUrl?: string;
}) {
  const email = input.email.trim().toLowerCase();

  const existing = await prisma.reader.findUnique({ where: { email } });
  if (existing) {
    const reader = await prisma.reader.update({
      where: { id: existing.id },
      data: {
        provider: input.provider,
        providerId: input.providerId,
        avatarUrl: input.avatarUrl ?? existing.avatarUrl,
        lastLogin: new Date(),
      },
    });
    return { id: reader.id, email: reader.email, name: reader.name };
  }

  const reader = await prisma.reader.create({
    data: {
      email,
      name: input.name.slice(0, 80) || email.split("@")[0],
      provider: input.provider,
      providerId: input.providerId,
      avatarUrl: input.avatarUrl,
      lastLogin: new Date(),
    },
  });
  return { id: reader.id, email: reader.email, name: reader.name };
}
