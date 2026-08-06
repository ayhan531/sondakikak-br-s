"use server";

import { redirect } from "next/navigation";
import {
  authenticateReader,
  createReaderSession,
  destroyReaderSession,
  registerReader,
} from "@/lib/reader-auth";

export type ReaderFormState = { error?: string };

/** Yalnızca site içi yollara izin ver (//evil.com ve /\evil.com açık yönlendirmeleri engellenir). */
function safePath(next: string): string {
  return next.startsWith("/") && !next.startsWith("//") && !next.startsWith("/\\") ? next : "/";
}

export async function readerRegisterAction(
  _previous: ReaderFormState,
  formData: FormData
): Promise<ReaderFormState> {
  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const next = String(formData.get("next") ?? "/");

  if (name.length < 2) return { error: "Lütfen adınızı yazın." };
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) return { error: "Geçerli bir e-posta girin." };
  if (password.length < 8) return { error: "Şifre en az 8 karakter olmalı." };

  const result = await registerReader(name, email, password);
  if (result.error || !result.reader) return { error: result.error ?? "Kayıt başarısız." };

  await createReaderSession(result.reader);
  redirect(safePath(next));
}

export async function readerLoginAction(
  _previous: ReaderFormState,
  formData: FormData
): Promise<ReaderFormState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const next = String(formData.get("next") ?? "/");

  const reader = await authenticateReader(email, password);
  if (!reader) return { error: "E-posta veya şifre hatalı." };

  await createReaderSession(reader);
  redirect(safePath(next));
}

export async function readerLogoutAction() {
  await destroyReaderSession();
  redirect("/");
}
