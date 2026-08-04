import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { CATEGORY_SEED } from "@/lib/categories";
import { SOURCE_SEED } from "@/lib/scraper/sources";

/**
 * Uygulama açılırken çalışır: yönetici hesabı, kategoriler, kaynaklar ve
 * reklam alanları yoksa oluşturur. Tekrar tekrar çalıştırılması güvenlidir.
 *
 * Render'da kalıcı disk yalnızca çalışma anında bağlandığı için bu işi
 * build adımında değil, sunucu ayağa kalkarken yapıyoruz.
 */
export async function ensureBootstrap(): Promise<void> {
  // --- Yönetici ---------------------------------------------------------
  const userCount = await prisma.user.count();
  if (userCount === 0) {
    const email = (process.env.ADMIN_EMAIL || "admin@sondakikakibris.com").toLowerCase();
    const password = process.env.ADMIN_PASSWORD;

    if (!password) {
      console.warn(
        "[bootstrap] ADMIN_PASSWORD tanımlı değil; yönetici hesabı oluşturulmadı."
      );
    } else {
      await prisma.user.create({
        data: {
          email,
          name: process.env.ADMIN_NAME || "Site Yöneticisi",
          password: await bcrypt.hash(password, 12),
          role: "admin",
        },
      });
      console.log(`[bootstrap] Yönetici hesabı oluşturuldu: ${email}`);
    }
  }

  // --- Kategoriler ------------------------------------------------------
  for (const [index, category] of CATEGORY_SEED.entries()) {
    await prisma.category.upsert({
      where: { slug: category.slug },
      create: {
        slug: category.slug,
        name: category.name,
        description: category.description,
        color: category.color,
        order: index,
        // Site adı sayfa başlığı şablonu tarafından zaten ekleniyor
        metaTitle: `${category.name} Haberleri`,
        metaDescription: category.description,
      },
      // Var olan kategorilerin yöneticinin yaptığı düzenlemeleri korunur
      update: {},
    });
  }

  // --- Kaynaklar --------------------------------------------------------
  for (const source of SOURCE_SEED) {
    await prisma.source.upsert({
      where: { slug: source.slug },
      create: {
        slug: source.slug,
        name: source.name,
        homepage: source.homepage,
        mode: source.mode,
        feedUrl: source.feedUrl ?? null,
        crawlUrls: JSON.stringify(source.crawlUrls ?? []),
        linkPattern: source.linkPattern ?? null,
        defaultCategorySlug: source.defaultCategorySlug,
        maxPerRun: source.maxPerRun,
        priority: source.priority,
      },
      update: {},
    });
  }

  // --- Reklam alanları --------------------------------------------------
  const adCount = await prisma.adSlot.count();
  if (adCount === 0) {
    await prisma.adSlot.createMany({
      data: [
        { name: "Üst Banner", placement: "header", type: "image", isActive: false },
        { name: "Manşet Altı", placement: "under-header", type: "image", isActive: false },
        { name: "Sağ Sütun Üst", placement: "sidebar-top", type: "image", isActive: false },
        { name: "Sağ Sütun Orta", placement: "sidebar-mid", type: "image", isActive: false },
        { name: "Haber Akışı Arası", placement: "in-feed", type: "image", isActive: false },
        { name: "Haber İçi Üst", placement: "article-top", type: "image", isActive: false },
        { name: "Haber İçi Orta", placement: "article-mid", type: "image", isActive: false },
        { name: "Haber Altı", placement: "article-bottom", type: "image", isActive: false },
        { name: "Alt Banner", placement: "footer", type: "image", isActive: false },
      ],
    });
  }
}
