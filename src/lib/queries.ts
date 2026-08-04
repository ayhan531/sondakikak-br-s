import { prisma } from "@/lib/prisma";
import { searchNormalize } from "@/lib/text";
import { cache } from "react";

/** Liste/kart görünümleri için gereken minimum alanlar. */
export const CARD_SELECT = {
  id: true,
  slug: true,
  title: true,
  summary: true,
  imageLocal: true,
  imageUrl: true,
  publishedAt: true,
  readingTime: true,
  views: true,
  isBreaking: true,
  sourceName: true,
  category: { select: { slug: true, name: true, color: true } },
} as const;

export type ArticleCardData = {
  id: string;
  slug: string;
  title: string;
  summary: string;
  imageLocal: string | null;
  imageUrl: string | null;
  publishedAt: Date;
  readingTime: number;
  views: number;
  isBreaking: boolean;
  sourceName: string | null;
  category: { slug: string; name: string; color: string } | null;
};

const PUBLISHED = { status: "published" as const };

/** Menüde görünen kategoriler. */
export const getMenuCategories = cache(async () => {
  return prisma.category.findMany({
    where: { isActive: true, showInMenu: true },
    orderBy: { order: "asc" },
    select: { slug: true, name: true, color: true },
  });
});

export const getAllCategories = cache(async () => {
  return prisma.category.findMany({
    where: { isActive: true },
    orderBy: { order: "asc" },
    select: { slug: true, name: true, color: true, description: true },
  });
});

/** Manşetler: elle işaretlenenler önce, yoksa en yeni haberler. */
export async function getHeadlines(limit = 5): Promise<ArticleCardData[]> {
  const pinned = await prisma.article.findMany({
    where: { ...PUBLISHED, isHeadline: true },
    orderBy: [{ order: "asc" }, { publishedAt: "desc" }],
    take: limit,
    select: CARD_SELECT,
  });

  if (pinned.length >= limit) return pinned;

  const filler = await prisma.article.findMany({
    where: { ...PUBLISHED, id: { notIn: pinned.map((a) => a.id) } },
    orderBy: { publishedAt: "desc" },
    take: limit - pinned.length,
    select: CARD_SELECT,
  });

  return [...pinned, ...filler];
}

export async function getLatest(options: {
  take?: number;
  skip?: number;
  categorySlug?: string;
  excludeIds?: string[];
} = {}): Promise<ArticleCardData[]> {
  const { take = 12, skip = 0, categorySlug, excludeIds = [] } = options;

  return prisma.article.findMany({
    where: {
      ...PUBLISHED,
      ...(categorySlug ? { category: { slug: categorySlug } } : {}),
      ...(excludeIds.length ? { id: { notIn: excludeIds } } : {}),
    },
    orderBy: { publishedAt: "desc" },
    take,
    skip,
    select: CARD_SELECT,
  });
}

export async function countArticles(categorySlug?: string): Promise<number> {
  return prisma.article.count({
    where: { ...PUBLISHED, ...(categorySlug ? { category: { slug: categorySlug } } : {}) },
  });
}

/** Son 7 günün en çok okunanları. */
export async function getMostRead(limit = 6, days = 7): Promise<ArticleCardData[]> {
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  const popular = await prisma.article.findMany({
    where: { ...PUBLISHED, publishedAt: { gte: since } },
    orderBy: [{ views: "desc" }, { publishedAt: "desc" }],
    take: limit,
    select: CARD_SELECT,
  });

  if (popular.length >= limit) return popular;

  // Yeni kurulan sitede henüz görüntülenme yoksa son haberlerle tamamla
  const filler = await prisma.article.findMany({
    where: { ...PUBLISHED, id: { notIn: popular.map((a) => a.id) } },
    orderBy: { publishedAt: "desc" },
    take: limit - popular.length,
    select: CARD_SELECT,
  });
  return [...popular, ...filler];
}

/** Son dakika bandı için işaretli haberler; yoksa son 6 saatin haberleri. */
export async function getBreaking(limit = 10): Promise<ArticleCardData[]> {
  const flagged = await prisma.article.findMany({
    where: { ...PUBLISHED, isBreaking: true },
    orderBy: { publishedAt: "desc" },
    take: limit,
    select: CARD_SELECT,
  });
  if (flagged.length > 0) return flagged;

  return prisma.article.findMany({
    where: { ...PUBLISHED },
    orderBy: { publishedAt: "desc" },
    take: limit,
    select: CARD_SELECT,
  });
}

export const getArticleBySlug = cache(async (slug: string) => {
  return prisma.article.findFirst({
    where: { slug, status: "published" },
    include: {
      category: true,
      tags: { include: { tag: true } },
    },
  });
});

/** İlgili haberler: önce aynı kategori, sonra ortak etiket. */
export async function getRelated(
  articleId: string,
  categoryId: string | null,
  tagIds: string[],
  limit = 6
): Promise<ArticleCardData[]> {
  const sameCategory = categoryId
    ? await prisma.article.findMany({
        where: { ...PUBLISHED, categoryId, id: { not: articleId } },
        orderBy: { publishedAt: "desc" },
        take: limit,
        select: CARD_SELECT,
      })
    : [];

  if (sameCategory.length >= limit || tagIds.length === 0) return sameCategory;

  const byTag = await prisma.article.findMany({
    where: {
      ...PUBLISHED,
      id: { not: articleId, notIn: sameCategory.map((a) => a.id) },
      tags: { some: { tagId: { in: tagIds } } },
    },
    orderBy: { publishedAt: "desc" },
    take: limit - sameCategory.length,
    select: CARD_SELECT,
  });

  return [...sameCategory, ...byTag];
}

export const getCategoryBySlug = cache(async (slug: string) => {
  return prisma.category.findFirst({ where: { slug, isActive: true } });
});

export const getTagBySlug = cache(async (slug: string) => {
  return prisma.tag.findUnique({ where: { slug } });
});

export async function getArticlesByTag(tagSlug: string, take = 24, skip = 0) {
  return prisma.article.findMany({
    where: { ...PUBLISHED, tags: { some: { tag: { slug: tagSlug } } } },
    orderBy: { publishedAt: "desc" },
    take,
    skip,
    select: CARD_SELECT,
  });
}

/**
 * Arama: normalize edilmiş searchText alanı üzerinden çalışır,
 * böylece "kibris" araması "Kıbrıs" sonuçlarını da getirir.
 */
export async function searchArticles(query: string, take = 20, skip = 0) {
  const normalized = searchNormalize(query);
  if (normalized.length < 2) return { results: [] as ArticleCardData[], total: 0 };

  const words = normalized.split(" ").filter((word) => word.length > 1).slice(0, 6);
  const where = {
    ...PUBLISHED,
    AND: words.map((word) => ({ searchText: { contains: word } })),
  };

  const [results, total] = await Promise.all([
    prisma.article.findMany({
      where,
      orderBy: { publishedAt: "desc" },
      take,
      skip,
      select: CARD_SELECT,
    }),
    prisma.article.count({ where }),
  ]);

  return { results, total };
}

/** Bir haberin görüntülenme sayısını artırır ve istatistik kaydı oluşturur. */
export async function recordView(articleId: string, path: string, meta: {
  referrer?: string | null;
  device?: string | null;
} = {}) {
  await Promise.all([
    prisma.article.update({
      where: { id: articleId },
      data: { views: { increment: 1 } },
    }),
    prisma.pageView.create({
      data: {
        articleId,
        path,
        referrer: meta.referrer ?? null,
        device: meta.device ?? null,
      },
    }),
  ]);
}

/** Kart görselini seçer: kendi kopyamız varsa onu, yoksa uzak adresi. */
export function articleImage(article: { imageLocal: string | null; imageUrl: string | null }) {
  return article.imageLocal ?? article.imageUrl ?? null;
}
