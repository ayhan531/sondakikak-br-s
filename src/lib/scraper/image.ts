import sharp from "sharp";
import { createHash } from "node:crypto";
import { fetchBinary } from "./http";
import { saveBuffer, mediaExists } from "@/lib/storage";

const MAX_WIDTH = 1280;
const MIN_BYTES = 3_000; // 3KB altı görseller genelde ikon/piksel

/**
 * Uzak görseli indirir, WebP'ye çevirir ve kendi sunucumuza kaydeder.
 * Kaynak site görseli silse bile haberimiz görselsiz kalmaz, ayrıca
 * WebP + tek boyut sayesinde sayfa hızı (Core Web Vitals) yüksek kalır.
 */
export async function ingestImage(
  remoteUrl: string,
  referer?: string
): Promise<string | null> {
  if (!remoteUrl || remoteUrl.startsWith("data:")) return null;

  let normalized: string;
  try {
    normalized = new URL(remoteUrl).toString();
  } catch {
    return null;
  }

  // Aynı görsel daha önce indirildiyse tekrar indirme
  const hash = createHash("sha1").update(normalized).digest("hex").slice(0, 20);
  const now = new Date();
  const guess = `${now.getFullYear()}/${String(now.getMonth() + 1).padStart(2, "0")}/${hash}.webp`;
  if (await mediaExists(guess)) return `/media/${guess}`;

  // Önce haber sayfası Referer'ıyla dene; olmazsa görselin kendi kökeniyle
  let result = await fetchBinary(normalized, {
    referer: referer ?? new URL(normalized).origin + "/",
  });
  if ((!result.ok || !result.data || result.data.length < MIN_BYTES) && referer) {
    result = await fetchBinary(normalized, { referer: new URL(normalized).origin + "/" });
  }
  if (!result.ok || !result.data || result.data.length < MIN_BYTES) return null;

  try {
    const image = sharp(result.data, { failOn: "none" });
    const meta = await image.metadata();
    if (!meta.width || !meta.height || meta.width < 200 || meta.height < 120) return null;

    const output = await image
      .rotate()
      .resize({ width: Math.min(meta.width, MAX_WIDTH), withoutEnlargement: true })
      .webp({ quality: 82 })
      .toBuffer();

    return await saveBuffer(output, "webp", normalized);
  } catch {
    return null;
  }
}

/** Admin panelinden yüklenen görseller için. */
export async function ingestUpload(buffer: Buffer, seed: string): Promise<string | null> {
  try {
    const image = sharp(buffer, { failOn: "none" });
    const meta = await image.metadata();
    if (!meta.width) return null;

    const output = await image
      .rotate()
      .resize({ width: Math.min(meta.width, MAX_WIDTH), withoutEnlargement: true })
      .webp({ quality: 85 })
      .toBuffer();

    return await saveBuffer(output, "webp", seed + Date.now());
  } catch {
    return null;
  }
}
