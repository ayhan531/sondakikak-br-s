import "dotenv/config";
import { ensureBootstrap } from "../src/lib/bootstrap";
import { prisma } from "../src/lib/prisma";

/** Yerel geliştirme için: `npm run db:seed` */
ensureBootstrap()
  .then(async () => {
    const [users, categories, sources, ads] = await Promise.all([
      prisma.user.count(),
      prisma.category.count(),
      prisma.source.count(),
      prisma.adSlot.count(),
    ]);
    console.log(
      `✓ Hazır: ${users} kullanıcı, ${categories} kategori, ${sources} kaynak, ${ads} reklam alanı`
    );
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
