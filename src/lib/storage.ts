import { createHash } from "node:crypto";
import { mkdir, writeFile, readFile, stat } from "node:fs/promises";
import path from "node:path";

/**
 * Görseller veritabanının yanındaki DATA_DIR klasöründe saklanır.
 * Render'da bu klasör kalıcı diske (/var/data) bağlanır, böylece deploy'larda kaybolmaz.
 */
export function dataDir(): string {
  const configured = process.env.DATA_DIR || "data";
  if (path.isAbsolute(configured)) return configured;
  // turbopackIgnore: derleyici bu yolu izlemeye çalışmasın, çalışma anında belirleniyor
  return path.join(/* turbopackIgnore: true */ process.cwd(), configured);
}

export function uploadsDir(): string {
  return path.join(dataDir(), "uploads");
}

/** "/media/2026/08/abc.webp" -> diskteki tam yol. Dizin dışına çıkışı engeller. */
export function resolveMediaPath(relative: string): string | null {
  const normalized = path.normalize(relative).replace(/^([/\\])+/, "");
  const full = path.join(uploadsDir(), normalized);
  if (!full.startsWith(uploadsDir())) return null;
  return full;
}

export async function saveBuffer(
  buffer: Buffer,
  extension: string,
  seed?: string
): Promise<string> {
  const hash = createHash("sha1")
    .update(seed ?? buffer)
    .digest("hex")
    .slice(0, 20);

  const now = new Date();
  const folder = `${now.getFullYear()}/${String(now.getMonth() + 1).padStart(2, "0")}`;
  const fileName = `${hash}.${extension}`;
  const relative = `${folder}/${fileName}`;
  const full = path.join(uploadsDir(), folder, fileName);

  await mkdir(path.dirname(full), { recursive: true });
  await writeFile(full, buffer);

  return `/media/${relative}`;
}

export async function mediaExists(relative: string): Promise<boolean> {
  const full = resolveMediaPath(relative);
  if (!full) return false;
  try {
    const info = await stat(full);
    return info.isFile();
  } catch {
    return false;
  }
}

export async function readMedia(relative: string): Promise<Buffer | null> {
  const full = resolveMediaPath(relative);
  if (!full) return null;
  try {
    return await readFile(full);
  } catch {
    return null;
  }
}
