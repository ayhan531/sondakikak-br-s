import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArticleCard } from "@/components/ArticleCard";
import { AdSlot } from "@/components/ads/AdSlot";
import { ReactionBar } from "@/components/ReactionBar";
import { ShareButtons } from "@/components/ShareButtons";
import { ViewTracker } from "@/components/ViewTracker";
import { articleImage, getArticleBySlug, getMostRead, getRelated } from "@/lib/queries";
import { getSettings } from "@/lib/settings";
import { formatDateTime } from "@/lib/format";
import { prisma } from "@/lib/prisma";
import { CommentForm } from "./CommentForm";

export const revalidate = 300;

type PageProps = { params: Promise<{ slug: string }> };

// ------------------------------------------------------------------ SEO

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const [article, settings] = await Promise.all([getArticleBySlug(slug), getSettings()]);

  if (!article) {
    return { title: "Haber bulunamadı", robots: { index: false, follow: false } };
  }

  const url = `${settings.siteUrl}/haber/${article.slug}`;
  const image = article.imageLocal
    ? `${settings.siteUrl}${article.imageLocal}`
    : article.imageUrl ?? undefined;

  return {
    title: article.metaTitle || article.title,
    description: article.metaDescription || article.summary,
    keywords: article.keywords?.split(",").map((word) => word.trim()),
    alternates: { canonical: url },
    openGraph: {
      type: "article",
      locale: "tr_TR",
      url,
      siteName: settings.siteName,
      title: article.title,
      description: article.metaDescription || article.summary,
      publishedTime: article.publishedAt.toISOString(),
      modifiedTime: article.updatedAt.toISOString(),
      section: article.category?.name,
      images: image ? [{ url: image, width: 1200, height: 675, alt: article.title }] : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title: article.title,
      description: article.metaDescription || article.summary,
      images: image ? [image] : undefined,
    },
    // Google Haberler'in başlık eşleştirmesi için ek anahtar kelimeler
    other: article.keywords ? { news_keywords: article.keywords } : undefined,
  };
}

// ------------------------------------------------------------------ Sayfa

/** Uzun haberlerin ortasına reklam yerleştirmek için gövdeyi ikiye böler. */
function splitContent(html: string): [string, string] {
  const parts = html.split("</p>");
  if (parts.length < 6) return [html, ""];

  const middle = Math.floor(parts.length / 2);
  return [
    parts.slice(0, middle).join("</p>") + "</p>",
    parts.slice(middle).join("</p>"),
  ];
}

export default async function ArticlePage({ params }: PageProps) {
  const { slug } = await params;
  const article = await getArticleBySlug(slug);
  if (!article) notFound();

  const settings = await getSettings();
  const url = `${settings.siteUrl}/haber/${article.slug}`;
  const image = articleImage(article);
  const tagIds = article.tags.map((entry) => entry.tagId);

  const [related, mostRead, comments] = await Promise.all([
    getRelated(article.id, article.categoryId, tagIds, 6),
    getMostRead(6),
    prisma.comment.findMany({
      where: { articleId: article.id, status: "approved" },
      orderBy: { createdAt: "desc" },
      take: 100,
      include: { reader: { select: { name: true } } },
    }),
  ]);

  const [firstHalf, secondHalf] = splitContent(article.content);

  // Google Haberler ve zengin sonuçlar için yapısal veri
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "NewsArticle",
        "@id": url,
        mainEntityOfPage: { "@type": "WebPage", "@id": url },
        headline: article.title.slice(0, 110),
        description: article.metaDescription || article.summary,
        image: image
          ? [image.startsWith("http") ? image : `${settings.siteUrl}${image}`]
          : undefined,
        datePublished: article.publishedAt.toISOString(),
        dateModified: article.updatedAt.toISOString(),
        articleSection: article.category?.name,
        inLanguage: "tr-TR",
        keywords: article.keywords ?? undefined,
        wordCount: article.content.replace(/<[^>]+>/g, " ").split(/\s+/).length,
        author: {
          "@type": "Organization",
          name: settings.siteName,
          url: settings.siteUrl,
        },
        publisher: {
          "@type": "NewsMediaOrganization",
          name: settings.siteName,
          url: settings.siteUrl,
          logo: {
            "@type": "ImageObject",
            url: `${settings.siteUrl}/logo.png`,
            width: 512,
            height: 512,
          },
        },
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Ana Sayfa", item: settings.siteUrl },
          ...(article.category
            ? [
                {
                  "@type": "ListItem",
                  position: 2,
                  name: article.category.name,
                  item: `${settings.siteUrl}/kategori/${article.category.slug}`,
                },
              ]
            : []),
          {
            "@type": "ListItem",
            position: article.category ? 3 : 2,
            name: article.title,
            item: url,
          },
        ],
      },
    ],
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-5">
      <script
        type="application/ld+json"
        // Yapısal veri kendi verimizden üretiliyor
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }}
      />
      <ViewTracker articleId={article.id} />

      <div className="grid gap-8 lg:grid-cols-3">
        <article className="lg:col-span-2">
          {/* Kırıntı navigasyonu */}
          <nav aria-label="Sayfa yolu" className="mb-3 flex flex-wrap items-center gap-1.5 text-xs text-ink-500">
            <Link href="/" className="transition hover:text-brand-600">Ana Sayfa</Link>
            <span>/</span>
            {article.category && (
              <>
                <Link
                  href={`/kategori/${article.category.slug}`}
                  className="font-semibold transition hover:text-brand-600"
                  style={{ color: article.category.color }}
                >
                  {article.category.name}
                </Link>
                <span>/</span>
              </>
            )}
            <span className="line-clamp-1 text-ink-400">{article.title}</span>
          </nav>

          <header className="mb-5">
            {article.isBreaking && (
              <span className="mb-3 inline-flex items-center gap-1.5 rounded bg-brand-600 px-2.5 py-1 text-xs font-bold uppercase tracking-wide text-white">
                <span className="h-1.5 w-1.5 animate-pulse-dot rounded-full bg-white" />
                Son Dakika
              </span>
            )}

            <h1 className="text-2xl font-black leading-tight text-ink-900 sm:text-3xl md:text-4xl">
              {article.title}
            </h1>

            <p className="mt-3 text-base leading-relaxed text-ink-600 sm:text-lg">
              {article.summary}
            </p>

            <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 border-y border-ink-200 py-3 text-xs text-ink-500">
              <time dateTime={article.publishedAt.toISOString()} className="font-semibold text-ink-700">
                {formatDateTime(article.publishedAt)}
              </time>
              <span>{article.readingTime} dakika okuma</span>
              {article.author && <span>Haber: {article.author}</span>}
            </div>

            <div className="mt-4">
              <ShareButtons url={url} title={article.title} />
            </div>
          </header>

          {image && (
            <figure className="mb-6 overflow-hidden rounded-xl">
              <Image
                src={image}
                alt={article.imageAlt ?? article.title}
                width={1280}
                height={720}
                priority
                sizes="(max-width: 1024px) 100vw, 66vw"
                className="h-auto w-full object-cover"
              />
            </figure>
          )}

          <AdSlot placement="article-top" className="mb-6" />

          {/* Gövde: içerik kendi temizleyicimizden geçmiş güvenli HTML */}
          <div className="article-body" dangerouslySetInnerHTML={{ __html: firstHalf }} />

          {secondHalf && (
            <>
              <AdSlot placement="article-mid" className="my-6" />
              <div className="article-body" dangerouslySetInnerHTML={{ __html: secondHalf }} />
            </>
          )}

          {/* Etiketler */}
          {article.tags.length > 0 && (
            <div className="mt-8 flex flex-wrap items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wide text-ink-500">
                Etiketler
              </span>
              {article.tags.map((entry) => (
                <Link
                  key={entry.tagId}
                  href={`/etiket/${entry.tag.slug}`}
                  className="rounded-full bg-ink-200 px-3 py-1 text-xs font-semibold text-ink-700 transition hover:bg-brand-600 hover:text-white"
                >
                  #{entry.tag.name}
                </Link>
              ))}
            </div>
          )}

          <div className="mt-6">
            <ReactionBar articleId={article.id} />
          </div>

          <div className="mt-6 rounded-xl bg-white p-4 shadow-sm ring-1 ring-ink-200/70">
            <ShareButtons url={url} title={article.title} />
          </div>

          <AdSlot placement="article-bottom" className="mt-6" />

          {/* Yorumlar */}
          <section aria-label="Yorumlar" className="mt-10">
            <h2 className="mb-4 border-b-2 border-brand-600 pb-2 text-lg font-black uppercase text-ink-900">
              Yorumlar {comments.length > 0 && `(${comments.length})`}
            </h2>

            <CommentForm articleId={article.id} slug={article.slug} />

            {comments.length > 0 && (
              <div className="mt-6 space-y-4">
                {comments.map((comment) => (
                  <div key={comment.id} className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-ink-200/70">
                    <div className="flex items-center gap-2 text-xs text-ink-500">
                      <span className="flex h-7 w-7 items-center justify-center rounded-full bg-brand-100 text-xs font-black text-brand-700">
                        {comment.reader.name.slice(0, 1).toLocaleUpperCase("tr-TR")}
                      </span>
                      <span className="font-bold text-ink-800">{comment.reader.name}</span>
                      <span>·</span>
                      <time dateTime={comment.createdAt.toISOString()}>
                        {formatDateTime(comment.createdAt)}
                      </time>
                    </div>
                    <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-ink-700">
                      {comment.content}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* İlgili haberler */}
          {related.length > 0 && (
            <section aria-label="İlgili haberler" className="mt-10">
              <h2 className="mb-4 border-b-2 border-brand-600 pb-2 text-lg font-black uppercase text-ink-900">
                İlgili Haberler
              </h2>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {related.map((item) => (
                  <ArticleCard key={item.id} article={item} variant="small" />
                ))}
              </div>
            </section>
          )}
        </article>

        {/* Sağ sütun */}
        <aside className="space-y-6">
          <AdSlot placement="sidebar-top" />

          <section className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-ink-200/70">
            <h2 className="mb-4 border-b-2 border-ink-900 pb-2 text-base font-black uppercase text-ink-900">
              En Çok Okunan
            </h2>
            <div className="space-y-3">
              {mostRead.map((item, index) => (
                <ArticleCard key={item.id} article={item} variant="rank" rank={index + 1} />
              ))}
            </div>
          </section>

          <AdSlot placement="sidebar-mid" />
        </aside>
      </div>
    </div>
  );
}
