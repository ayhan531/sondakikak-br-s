"use server";

import { revalidatePath } from "next/cache";
import { assertUser } from "@/lib/admin-guard";
import { DEFAULT_SETTINGS, saveSettings, type SettingKey } from "@/lib/settings";
import { prisma } from "@/lib/prisma";
import { hashPassword, verifyPassword } from "@/lib/auth";

export type SettingsState = { error?: string; success?: string };

export async function saveSettingsAction(
  _previous: SettingsState,
  formData: FormData
): Promise<SettingsState> {
  await assertUser();

  const values: Partial<Record<SettingKey, string>> = {};

  for (const key of Object.keys(DEFAULT_SETTINGS) as SettingKey[]) {
    const raw = formData.get(key);

    // Onay kutuları gönderilmediğinde "false" olarak kaydedilmeli
    if (DEFAULT_SETTINGS[key] === "true" || DEFAULT_SETTINGS[key] === "false") {
      values[key] = raw === "on" || raw === "true" ? "true" : "false";
      continue;
    }
    if (raw === null) continue;
    values[key] = String(raw).trim();
  }

  if (values.siteUrl && !/^https?:\/\//i.test(values.siteUrl)) {
    return { error: "Site adresi http:// veya https:// ile başlamalı." };
  }

  await saveSettings(values);

  revalidatePath("/", "layout");
  revalidatePath("/admin/ayarlar");
  return { success: "Ayarlar kaydedildi." };
}

export type PasswordState = { error?: string; success?: string };

export async function changePasswordAction(
  _previous: PasswordState,
  formData: FormData
): Promise<PasswordState> {
  const user = await assertUser();

  const current = String(formData.get("currentPassword") ?? "");
  const next = String(formData.get("newPassword") ?? "");
  const confirm = String(formData.get("confirmPassword") ?? "");

  if (next.length < 8) return { error: "Yeni şifre en az 8 karakter olmalı." };
  if (next !== confirm) return { error: "Yeni şifreler birbiriyle eşleşmiyor." };

  const record = await prisma.user.findUnique({ where: { id: user.id } });
  if (!record) return { error: "Kullanıcı bulunamadı." };

  const ok = await verifyPassword(current, record.password);
  if (!ok) return { error: "Mevcut şifre hatalı." };

  await prisma.user.update({
    where: { id: user.id },
    data: { password: await hashPassword(next) },
  });

  return { success: "Şifreniz güncellendi." };
}
