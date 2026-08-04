import "dotenv/config";
import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed.ts",
  },
  datasource: {
    // Build sırasında (prisma generate) DATABASE_URL tanımlı olmayabilir;
    // env() yerine fallback kullanıyoruz ki build patlamasın.
    url: process.env.DATABASE_URL ?? "file:./data/sondakika.db",
  },
});
