import { prisma } from "@/lib/prisma";
import { AdRender } from "./AdRender";

export type Placement =
  | "header"
  | "under-header"
  | "sidebar-top"
  | "sidebar-mid"
  | "sidebar-bottom"
  | "in-feed"
  | "article-top"
  | "article-mid"
  | "article-bottom"
  | "footer";

export const PLACEMENT_LABELS: Record<Placement, string> = {
  header: "Üst banner (logo hizası)",
  "under-header": "Menü altı / manşet üstü",
  "sidebar-top": "Sağ sütun — üst",
  "sidebar-mid": "Sağ sütun — orta",
  "sidebar-bottom": "Sağ sütun — alt",
  "in-feed": "Haber akışı arası",
  "article-top": "Haber içi — başlık altı",
  "article-mid": "Haber içi — metin ortası",
  "article-bottom": "Haber içi — metin sonu",
  footer: "Sayfa altı banner",
};

/**
 * Belirtilen konum için yayında olan reklamı gösterir.
 * Aynı konumda birden fazla reklam varsa `order` sırasına göre ilki seçilir.
 */
export async function AdSlot({
  placement,
  className = "",
}: {
  placement: Placement;
  className?: string;
}) {
  const now = new Date();

  const ad = await prisma.adSlot.findFirst({
    where: {
      placement,
      isActive: true,
      AND: [
        { OR: [{ startsAt: null }, { startsAt: { lte: now } }] },
        { OR: [{ endsAt: null }, { endsAt: { gte: now } }] },
      ],
    },
    orderBy: [{ order: "asc" }, { createdAt: "desc" }],
    select: {
      id: true,
      name: true,
      type: true,
      htmlCode: true,
      imageUrl: true,
      imageUrlMobile: true,
      linkUrl: true,
      altText: true,
    },
  });

  if (!ad) return null;
  if (ad.type === "html" ? !ad.htmlCode : !ad.imageUrl) return null;

  return <AdRender ad={ad} className={className} />;
}
