import { NextResponse } from "next/server";
import { readMedia } from "@/lib/storage";

/**
 * Haber görselleri veritabanının yanındaki kalıcı diskte durur (public/ içinde değil),
 * bu yüzden buradan servis ediyoruz. İçerik hash'li isimlerle saklandığı için
 * agresif önbellekleme güvenli.
 */

const MIME: Record<string, string> = {
  webp: "image/webp",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  gif: "image/gif",
  avif: "image/avif",
  svg: "image/svg+xml",
};

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params;
  const relative = path.join("/");

  const data = await readMedia(relative);
  if (!data) {
    return new NextResponse("Görsel bulunamadı", { status: 404 });
  }

  const extension = relative.split(".").pop()?.toLowerCase() ?? "webp";

  return new NextResponse(new Uint8Array(data), {
    headers: {
      "content-type": MIME[extension] ?? "application/octet-stream",
      "cache-control": "public, max-age=31536000, immutable",
      "content-length": String(data.length),
    },
  });
}
