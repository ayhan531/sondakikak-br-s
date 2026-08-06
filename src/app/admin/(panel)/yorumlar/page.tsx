import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { assertUser } from "@/lib/admin-guard";
import { Badge, Button, Card, EmptyState, PageHeader } from "@/components/admin/ui";
import { formatDateTime } from "@/lib/format";
import {
  approveCommentAction,
  deleteCommentAction,
  rejectCommentAction,
} from "./actions";

export const dynamic = "force-dynamic";

const STATUS_META: Record<string, { label: string; tone: "amber" | "green" | "red" }> = {
  pending: { label: "Onay bekliyor", tone: "amber" },
  approved: { label: "Yayında", tone: "green" },
  rejected: { label: "Reddedildi", tone: "red" },
};

export default async function CommentsAdminPage({
  searchParams,
}: {
  searchParams: Promise<{ durum?: string }>;
}) {
  await assertUser();
  const { durum = "pending" } = await searchParams;
  const filter = ["pending", "approved", "rejected", "hepsi"].includes(durum) ? durum : "pending";

  const [comments, pendingCount] = await Promise.all([
    prisma.comment.findMany({
      where: filter === "hepsi" ? {} : { status: filter },
      orderBy: { createdAt: "desc" },
      take: 200,
      include: {
        reader: { select: { name: true, email: true } },
        article: { select: { title: true, slug: true } },
      },
    }),
    prisma.comment.count({ where: { status: "pending" } }),
  ]);

  return (
    <div>
      <PageHeader
        title="Yorumlar"
        description={
          pendingCount > 0
            ? `${pendingCount} yorum onay bekliyor.`
            : "Okur yorumları burada denetlenir."
        }
      />

      <div className="mb-4 flex flex-wrap gap-2">
        {(
          [
            ["pending", "Onay Bekleyen"],
            ["approved", "Yayında"],
            ["rejected", "Reddedilen"],
            ["hepsi", "Tümü"],
          ] as const
        ).map(([value, label]) => (
          <Link
            key={value}
            href={`/admin/yorumlar?durum=${value}`}
            className={`rounded-lg px-4 py-2 text-sm font-bold transition ${
              filter === value
                ? "bg-brand-600 text-white"
                : "bg-white text-ink-600 ring-1 ring-ink-200 hover:bg-ink-50"
            }`}
          >
            {label}
          </Link>
        ))}
      </div>

      {comments.length === 0 ? (
        <Card>
          <EmptyState message="Bu durumda yorum yok." />
        </Card>
      ) : (
        <div className="space-y-4">
          {comments.map((comment) => {
            const meta = STATUS_META[comment.status] ?? STATUS_META.pending;
            return (
              <Card key={comment.id}>
                <div className="p-5">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-bold text-ink-900">{comment.reader.name}</p>
                        <Badge tone={meta.tone}>{meta.label}</Badge>
                      </div>
                      <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-ink-500">
                        <span>{comment.reader.email}</span>
                        <time dateTime={comment.createdAt.toISOString()}>
                          {formatDateTime(comment.createdAt)}
                        </time>
                      </div>
                      <Link
                        href={`/haber/${comment.article.slug}`}
                        className="mt-1 block truncate text-xs font-semibold text-brand-600 hover:underline"
                      >
                        {comment.article.title}
                      </Link>
                    </div>

                    <div className="flex shrink-0 items-center gap-2">
                      {comment.status !== "approved" && (
                        <form action={approveCommentAction}>
                          <input type="hidden" name="id" value={comment.id} />
                          <Button type="submit" variant="primary" size="sm">Onayla</Button>
                        </form>
                      )}
                      {comment.status !== "rejected" && (
                        <form action={rejectCommentAction}>
                          <input type="hidden" name="id" value={comment.id} />
                          <Button type="submit" variant="ghost" size="sm">Reddet</Button>
                        </form>
                      )}
                      <form action={deleteCommentAction}>
                        <input type="hidden" name="id" value={comment.id} />
                        <Button type="submit" variant="danger" size="sm">Sil</Button>
                      </form>
                    </div>
                  </div>

                  <p className="mt-3 whitespace-pre-wrap rounded-lg bg-ink-50 p-4 text-sm leading-relaxed text-ink-800">
                    {comment.content}
                  </p>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
