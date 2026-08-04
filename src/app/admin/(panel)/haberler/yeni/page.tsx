import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/admin/ui";
import { ArticleForm } from "../ArticleForm";

export const dynamic = "force-dynamic";

function localDateTimeValue(date: Date): string {
  const offset = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
}

export default async function NewArticlePage() {
  const categories = await prisma.category.findMany({
    orderBy: { order: "asc" },
    select: { id: true, name: true },
  });

  return (
    <>
      <PageHeader title="Yeni Haber" description="Kendi haberinizi yazın ve yayınlayın" />
      <ArticleForm
        categories={categories}
        article={{ publishedAt: localDateTimeValue(new Date()), status: "published" }}
      />
    </>
  );
}
