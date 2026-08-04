import { prisma } from "@/lib/prisma";
import { Badge, Card, PageHeader } from "@/components/admin/ui";
import { deleteCategoryAction } from "./actions";
import { CategoryEditor, NewCategoryPanel } from "./CategoryForm";

export const dynamic = "force-dynamic";

export default async function CategoriesPage() {
  const categories = await prisma.category.findMany({
    orderBy: { order: "asc" },
    include: { _count: { select: { articles: true } } },
  });

  return (
    <>
      <PageHeader
        title="Kategoriler"
        description="Menü sırası, renkler ve SEO ayarları"
      />

      <div className="mb-6">
        <NewCategoryPanel />
      </div>

      <Card>
        <ul className="divide-y divide-ink-100">
          {categories.map((category) => (
            <li key={category.id} className="flex flex-wrap items-start gap-3 px-4 py-3.5">
              <span
                className="mt-1 h-8 w-1.5 shrink-0 rounded-full"
                style={{ backgroundColor: category.color }}
              />

              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-bold text-ink-900">{category.name}</span>
                  <Badge tone={category.isActive ? "green" : "gray"}>
                    {category.isActive ? "Aktif" : "Kapalı"}
                  </Badge>
                  {!category.showInMenu && <Badge tone="amber">Menüde yok</Badge>}
                </div>
                <p className="mt-0.5 text-xs text-ink-500">
                  /kategori/{category.slug} • {category._count.articles} haber • sıra {category.order}
                </p>
                {category.description && (
                  <p className="mt-1 line-clamp-1 text-xs text-ink-400">{category.description}</p>
                )}
              </div>

              <div className="flex items-center gap-1.5">
                <CategoryEditor
                  category={{
                    id: category.id,
                    name: category.name,
                    slug: category.slug,
                    description: category.description,
                    color: category.color,
                    order: category.order,
                    isActive: category.isActive,
                    showInMenu: category.showInMenu,
                    metaTitle: category.metaTitle,
                    metaDescription: category.metaDescription,
                  }}
                />
                <form action={deleteCategoryAction}>
                  <input type="hidden" name="id" value={category.id} />
                  <button
                    type="submit"
                    className="rounded bg-brand-50 px-2.5 py-1 text-[11px] font-bold text-brand-700 transition hover:bg-brand-100"
                  >
                    Sil
                  </button>
                </form>
              </div>
            </li>
          ))}
        </ul>
      </Card>

      <p className="mt-4 text-xs text-ink-500">
        Bir kategoriyi sildiğinizde o kategorideki haberler silinmez, yalnızca kategorisiz kalır.
      </p>
    </>
  );
}
