import { NextResponse } from "next/server";
import { requireCronSecret } from "@/lib/cron-auth";
import { cleanupJunkTags, recleanArticles, repairMissingImages } from "@/lib/maintenance";
import { revalidatePath } from "next/cache";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

/**
 * Bakım ucu:
 *   /api/cron/bakim?islem=reclean      — kayıtlı haberleri yeniden temizle
 *   /api/cron/bakim?islem=gorsel-onar  — eksik yerel görselleri yeniden indir
 *
 *   curl -H "Authorization: Bearer $CRON_SECRET" "https://site/api/cron/bakim?islem=reclean"
 */
async function handle(request: Request) {
  const unauthorized = requireCronSecret(request);
  if (unauthorized) return unauthorized;

  const islem = new URL(request.url).searchParams.get("islem") ?? "reclean";

  if (islem === "gorsel-onar") {
    const result = await repairMissingImages();
    revalidatePath("/", "layout");
    return NextResponse.json({ ok: true, islem, ...result });
  }

  if (islem === "etiket-temizle") {
    const result = await cleanupJunkTags();
    revalidatePath("/", "layout");
    return NextResponse.json({ ok: true, islem, ...result });
  }

  if (islem === "reclean") {
    const result = await recleanArticles();
    revalidatePath("/", "layout");
    return NextResponse.json({ ok: true, islem, ...result });
  }

  return NextResponse.json({ ok: false, error: "Bilinmeyen işlem" }, { status: 400 });
}

export async function GET(request: Request) {
  return handle(request);
}

export async function POST(request: Request) {
  return handle(request);
}
