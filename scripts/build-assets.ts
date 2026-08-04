import sharp from "sharp";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

/**
 * Marka görsellerini (favicon, logo, paylaşım görseli) tek kaynaktan üretir.
 *   npm run build:assets
 */

const PUBLIC_DIR = path.join(process.cwd(), "public");
const APP_DIR = path.join(process.cwd(), "src", "app");

const MARK_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" width="512" height="512">
  <rect width="48" height="48" rx="11" fill="#dc2626"/>
  <circle cx="24" cy="24" r="4.4" fill="#fff"/>
  <path d="M15.2 15.2a12.4 12.4 0 0 0 0 17.6" stroke="#fff" stroke-width="3" stroke-linecap="round" fill="none"/>
  <path d="M32.8 15.2a12.4 12.4 0 0 1 0 17.6" stroke="#fff" stroke-width="3" stroke-linecap="round" fill="none"/>
  <path d="M9.6 9.6a20 20 0 0 0 0 28.8" stroke="#fff" stroke-width="2.4" stroke-linecap="round" fill="none" opacity=".5"/>
  <path d="M38.4 9.6a20 20 0 0 1 0 28.8" stroke="#fff" stroke-width="2.4" stroke-linecap="round" fill="none" opacity=".5"/>
</svg>`;

const OG_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1200" y2="630" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="#0f172a"/>
      <stop offset="100%" stop-color="#1e293b"/>
    </linearGradient>
  </defs>
  <rect width="1200" height="630" fill="url(#bg)"/>
  <rect x="0" y="0" width="1200" height="8" fill="#dc2626"/>

  <g transform="translate(120,214) scale(2.6)">
    <rect width="48" height="48" rx="11" fill="#dc2626"/>
    <circle cx="24" cy="24" r="4.4" fill="#fff"/>
    <path d="M15.2 15.2a12.4 12.4 0 0 0 0 17.6" stroke="#fff" stroke-width="3" stroke-linecap="round" fill="none"/>
    <path d="M32.8 15.2a12.4 12.4 0 0 1 0 17.6" stroke="#fff" stroke-width="3" stroke-linecap="round" fill="none"/>
  </g>

  <text x="480" y="290" font-family="Arial, Helvetica, sans-serif" font-size="76" font-weight="bold" fill="#ffffff">sondakika<tspan fill="#ef4444">kıbrıs</tspan></text>
  <text x="484" y="345" font-family="Arial, Helvetica, sans-serif" font-size="27" letter-spacing="7" fill="#94a3b8">KIBRIS'IN NABZI</text>
  <text x="484" y="410" font-family="Arial, Helvetica, sans-serif" font-size="30" fill="#cbd5e1">Kıbrıs ve KKTC'den son dakika haberleri</text>
</svg>`;

async function main() {
  await mkdir(PUBLIC_DIR, { recursive: true });

  const mark = Buffer.from(MARK_SVG);

  // JSON-LD publisher logosu ve genel kullanım
  await sharp(mark).resize(512, 512).png().toFile(path.join(PUBLIC_DIR, "logo.png"));

  // Tarayıcı sekmesi ve mobil ana ekran ikonları
  await sharp(mark).resize(192, 192).png().toFile(path.join(PUBLIC_DIR, "icon-192.png"));
  await sharp(mark).resize(512, 512).png().toFile(path.join(PUBLIC_DIR, "icon-512.png"));
  await sharp(mark).resize(180, 180).png().toFile(path.join(APP_DIR, "apple-icon.png"));
  await sharp(mark).resize(32, 32).png().toFile(path.join(APP_DIR, "icon.png"));

  // Sosyal medya paylaşım görseli
  await sharp(Buffer.from(OG_SVG)).png().toFile(path.join(APP_DIR, "opengraph-image.png"));

  await writeFile(path.join(PUBLIC_DIR, "logo.svg"), MARK_SVG, "utf8");

  console.log("✓ Logo, ikonlar ve paylaşım görseli üretildi.");
}

main();
