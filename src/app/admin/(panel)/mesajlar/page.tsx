import { prisma } from "@/lib/prisma";
import { assertUser } from "@/lib/admin-guard";
import { Badge, Button, Card, EmptyState, PageHeader } from "@/components/admin/ui";
import { formatDateTime } from "@/lib/format";
import { deleteMessageAction, toggleMessageReadAction } from "./actions";

export const dynamic = "force-dynamic";

export default async function MessagesPage() {
  await assertUser();

  const messages = await prisma.contactMessage.findMany({
    orderBy: [{ isRead: "asc" }, { createdAt: "desc" }],
    take: 200,
  });

  const unread = messages.filter((message) => !message.isRead).length;

  return (
    <div>
      <PageHeader
        title="Gelen Mesajlar"
        description={
          unread > 0
            ? `${unread} okunmamış mesajınız var.`
            : "İletişim formundan gelen mesajlar burada listelenir."
        }
      />

      {messages.length === 0 ? (
        <Card>
          <EmptyState message="Henüz mesaj yok. İletişim sayfasındaki formdan gelen mesajlar burada görünecek." />
        </Card>
      ) : (
        <div className="space-y-4">
          {messages.map((message) => (
            <Card key={message.id} className={message.isRead ? "opacity-75" : ""}>
              <div className="p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-bold text-ink-900">{message.name}</p>
                      {!message.isRead && <Badge tone="red">Yeni</Badge>}
                      {message.subject && <Badge tone="blue">{message.subject}</Badge>}
                    </div>
                    <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-ink-500">
                      <a href={`mailto:${message.email}`} className="font-semibold text-brand-600 hover:underline">
                        {message.email}
                      </a>
                      {message.phone && (
                        <a href={`tel:${message.phone.replace(/\s/g, "")}`} className="hover:underline">
                          {message.phone}
                        </a>
                      )}
                      <time dateTime={message.createdAt.toISOString()}>
                        {formatDateTime(message.createdAt)}
                      </time>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <form action={toggleMessageReadAction}>
                      <input type="hidden" name="id" value={message.id} />
                      <Button type="submit" variant="ghost" size="sm">
                        {message.isRead ? "Okunmadı işaretle" : "Okundu işaretle"}
                      </Button>
                    </form>
                    <form action={deleteMessageAction}>
                      <input type="hidden" name="id" value={message.id} />
                      <Button type="submit" variant="danger" size="sm">
                        Sil
                      </Button>
                    </form>
                  </div>
                </div>

                <p className="mt-3 whitespace-pre-wrap rounded-lg bg-ink-50 p-4 text-sm leading-relaxed text-ink-800">
                  {message.message}
                </p>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
