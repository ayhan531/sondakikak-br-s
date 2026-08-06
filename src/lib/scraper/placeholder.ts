import sharp from "sharp";
import { saveMediaAs, mediaExists } from "@/lib/storage";

/**
 * Görseli olmayan haberler için kategori renginde markalı kapak üretir.
 * Kategori başına bir kez üretilir ve tekrar kullanılır — böylece hiçbir
 * haber görselsiz kalmaz.
 */

const WIDTH = 1280;
const HEIGHT = 720;

function darken(hex: string, amount: number): string {
  const value = hex.replace("#", "");
  const full = value.length === 3 ? value.split("").map((c) => c + c).join("") : value;
  const [r, g, b] = [0, 2, 4].map((i) =>
    Math.max(0, Math.round(parseInt(full.slice(i, i + 2), 16) * (1 - amount)))
  );
  return `#${[r, g, b].map((c) => c.toString(16).padStart(2, "0")).join("")}`;
}

function escapeXml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export async function ensurePlaceholder(
  categorySlug: string,
  categoryName: string,
  color = "#dc2626"
): Promise<string> {
  const relative = `placeholder/${categorySlug || "genel"}.webp`;
  if (await mediaExists(relative)) return `/media/${relative}`;

  const dark = darken(color, 0.55);
  const mid = darken(color, 0.25);
  const label = escapeXml((categoryName || "HABER").toLocaleUpperCase("tr-TR"));

  const svg = `
<svg xmlns="http://www.w3.org/2000/svg" width="${WIDTH}" height="${HEIGHT}" viewBox="0 0 ${WIDTH} ${HEIGHT}">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="${mid}"/>
      <stop offset="1" stop-color="${dark}"/>
    </linearGradient>
  </defs>
  <rect width="${WIDTH}" height="${HEIGHT}" fill="url(#bg)"/>
  <circle cx="1120" cy="120" r="260" fill="#ffffff" opacity="0.06"/>
  <circle cx="140" cy="620" r="200" fill="#000000" opacity="0.12"/>
  <rect x="80" y="292" width="72" height="10" rx="5" fill="#ffffff" opacity="0.85"/>
  <text x="80" y="360" font-family="DejaVu Sans, Arial, sans-serif" font-size="58" font-weight="bold" fill="#ffffff" letter-spacing="1">${label}</text>
  <text x="80" y="416" font-family="DejaVu Sans, Arial, sans-serif" font-size="30" fill="#ffffff" opacity="0.85">sondakikakibris.com</text>
  <rect x="80" y="580" width="380" height="52" rx="8" fill="#ffffff" opacity="0.12"/>
  <text x="102" y="614" font-family="DejaVu Sans, Arial, sans-serif" font-size="26" font-weight="bold" fill="#ffffff">SON DAKİKA KIBRIS</text>
</svg>`;

  const buffer = await sharp(Buffer.from(svg)).webp({ quality: 82 }).toBuffer();
  await saveMediaAs(buffer, relative);
  return `/media/${relative}`;
}
