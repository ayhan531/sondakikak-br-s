import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Button, PageHeader } from "@/components/admin/ui";
import { formatCount } from "@/lib/format";
import { ArticleForm } from "../ArticleForm";
import { deleteArticleAction } from "../actions";

export const dynamic = "force-dynamic";

function localDateTimeValue(date: Date): string {
  const offset = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
}

export default async function EditArticlePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const [article, categories] = await Promise.all([
    prisma.article.findUnique({ where: { id } }),
    prisma.category.findMany({ orderBy: { order: "asc" }, select: { id: true, name: true } }),
  ]);

  if (!article) notFound();

  return (
    <>
      <PageHeader
        title="Haberi Düzenle"
        description={`${formatCount(article.views)} okunma${
          article.sourceName ? ` • Kaynak: ${article.sourceName}` : ""
        }`}
        action={
          <div className="flex gap-2">
            <Button href="/admin/haberler" variant="ghost">← Listeye dön</Button>
            <form action={deleteArticleAction}>
              <input type="hidden" name="id" value={article.id} />
              <input type="hidden" name="redirect" value="list" />
              <Button type="submit" variant="danger">Haberi Sil</Button>
            </form>
          </div>
        }
      />

      <ArticleForm
        categories={categories}
        article={{
          id: article.id,
          slug: article.slug,
          title: article.title,
          summary: article.summary,
          content: article.content,
          imageLocal: article.imageLocal,
          imageAlt: article.imageAlt,
          categoryId: article.categoryId,
          status: article.status,
          isBreaking: article.isBreaking,
          isHeadline: article.isHeadline,
          isFeatured: article.isFeatured,
          order: article.order,
          publishedAt: localDateTimeValue(article.publishedAt),
          metaTitle: article.metaTitle,
          metaDescription: article.metaDescription,
          keywords: article.keywords,
          author: article.author,
        }}
      />
    </>
  );
}
