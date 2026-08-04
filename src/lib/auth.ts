import "server-only";
import bcrypt from "bcryptjs";
import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { cache } from "react";
import { prisma } from "@/lib/prisma";

const COOKIE_NAME = "sdk_session";
const MAX_AGE_SECONDS = 60 * 60 * 24 * 7; // 7 gün

export type SessionUser = {
  id: string;
  email: string;
  name: string;
  role: string;
};

function secretKey(): Uint8Array {
  const secret = process.env.AUTH_SECRET;
  if (!secret || secret.length < 16) {
    throw new Error(
      "AUTH_SECRET tanımlı değil veya çok kısa. .env dosyasına güçlü bir anahtar ekleyin."
    );
  }
  return new TextEncoder().encode(secret);
}

export function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, 12);
}

export function verifyPassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}

export async function createSession(user: SessionUser) {
  const token = await new SignJWT({ ...user })
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

export async function destroySession() {
  const store = await cookies();
  store.delete(COOKIE_NAME);
}

/** Geçerli oturumdaki kullanıcıyı döndürür, yoksa null. */
export const getCurrentUser = cache(async (): Promise<SessionUser | null> => {
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
      role: String(payload.role ?? "editor"),
    };
  } catch {
    return null;
  }
});

/** Kimlik doğrulaması yapar; başarılıysa kullanıcıyı döndürür. */
export async function authenticate(email: string, password: string) {
  const user = await prisma.user.findUnique({
    where: { email: email.trim().toLowerCase() },
  });
  if (!user || !user.isActive) return null;

  const ok = await verifyPassword(password, user.password);
  if (!ok) return null;

  await prisma.user.update({
    where: { id: user.id },
    data: { lastLogin: new Date() },
  });

  return { id: user.id, email: user.email, name: user.name, role: user.role };
}
