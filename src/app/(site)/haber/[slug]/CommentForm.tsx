"use client";

import Link from "next/link";
import { useActionState, useEffect, useState } from "react";
import { addCommentAction, type CommentFormState } from "./comment-actions";

const initial: CommentFormState = {};

export function CommentForm({ articleId, slug }: { articleId: string; slug: string }) {
  const [state, formAction, pending] = useActionState(addCommentAction, initial);
  const [readerName, setReaderName] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/uye/ben")
      .then((res) => res.json())
      .then((data) => {
        if (!cancelled) {
          setReaderName(data?.reader?.name ?? null);
          setLoaded(true);
        }
      })
      .catch(() => setLoaded(true));
    return () => {
      cancelled = true;
    };
  }, []);

  if (!loaded) {
    return <div className="h-24 animate-pulse rounded-xl bg-ink-100" />;
  }

  if (!readerName) {
    const next = encodeURIComponent(`/haber/${slug}`);
    return (
      <div className="rounded-xl bg-ink-100 p-5 text-center">
        <p className="text-sm font-semibold text-ink-700">
          Yorum yapmak için üye olmanız gerekiyor.
        </p>
        <div className="mt-3 flex items-center justify-center gap-3">
          <Link
            href={`/uye/giris?next=${next}`}
            className="rounded-lg bg-brand-600 px-5 py-2 text-sm font-bold text-white transition hover:bg-brand-700"
          >
            Giriş Yap
          </Link>
          <Link
            href={`/uye/kayit?next=${next}`}
            className="rounded-lg bg-white px-5 py-2 text-sm font-bold text-ink-800 ring-1 ring-ink-300 transition hover:bg-ink-50"
          >
            Üye Ol
          </Link>
        </div>
      </div>
    );
  }

  if (state.success) {
    return (
      <div className="rounded-xl bg-emerald-50 p-5 text-center ring-1 ring-emerald-200">
        <p className="text-sm font-semibold text-emerald-700">{state.success}</p>
      </div>
    );
  }

  return (
    <form action={formAction} className="space-y-3">
      {state.error && (
        <p role="alert" className="rounded-lg bg-brand-50 px-4 py-3 text-sm font-medium text-brand-700 ring-1 ring-brand-200">
          {state.error}
        </p>
      )}
      <input type="hidden" name="articleId" value={articleId} />
      <input type="hidden" name="slug" value={slug} />
      <textarea
        name="content"
        required
        minLength={3}
        maxLength={2000}
        rows={4}
        placeholder={`${readerName}, düşünceleriniz…`}
        className="w-full rounded-lg border border-ink-300 bg-white px-3.5 py-2.5 text-sm text-ink-900 placeholder:text-ink-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-200"
      />
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs text-ink-400">Yorumlar editör onayından sonra yayınlanır.</p>
        <button
          type="submit"
          disabled={pending}
          className="rounded-lg bg-brand-600 px-6 py-2.5 text-sm font-bold text-white transition hover:bg-brand-700 disabled:opacity-60"
        >
          {pending ? "Gönderiliyor…" : "Yorum Gönder"}
        </button>
      </div>
    </form>
  );
}
