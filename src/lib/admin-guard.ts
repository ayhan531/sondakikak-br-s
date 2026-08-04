import "server-only";
import { redirect } from "next/navigation";
import { getCurrentUser, type SessionUser } from "@/lib/auth";

/** Panel sayfalarında ilk satırda çağrılır: oturum yoksa giriş sayfasına atar. */
export async function requireUser(): Promise<SessionUser> {
  const user = await getCurrentUser();
  if (!user) redirect("/admin/giris");
  return user;
}

/** Yalnızca yöneticilere açık işlemler için. */
export async function requireAdmin(): Promise<SessionUser> {
  const user = await requireUser();
  if (user.role !== "admin") redirect("/admin?hata=yetki");
  return user;
}

/** Server action'larda kullanılır: yetkisizse hata fırlatır. */
export async function assertUser(): Promise<SessionUser> {
  const user = await getCurrentUser();
  if (!user) throw new Error("Bu işlem için giriş yapmalısınız.");
  return user;
}
