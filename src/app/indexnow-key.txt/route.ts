import { INDEXNOW_KEY } from "@/lib/seo-ping";

/** IndexNow anahtar doğrulama dosyası (anahtar tasarım gereği herkese açıktır). */
export function GET() {
  return new Response(INDEXNOW_KEY, {
    headers: { "content-type": "text/plain; charset=utf-8" },
  });
}
