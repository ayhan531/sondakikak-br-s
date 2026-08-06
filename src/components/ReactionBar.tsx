"use client";

import { useEffect, useState } from "react";
import { REACTION_TYPES, REACTION_META, type ReactionType } from "@/lib/reactions";

type Counts = Record<string, number>;

export function ReactionBar({ articleId }: { articleId: string }) {
  const [counts, setCounts] = useState<Counts>({});
  const [mine, setMine] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/haber/${articleId}/tepki`)
      .then((res) => res.json())
      .then((data) => {
        if (!cancelled && data?.ok) {
          setCounts(data.counts ?? {});
          setMine(data.myReaction ?? null);
        }
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [articleId]);

  const react = async (type: ReactionType) => {
    if (busy) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/haber/${articleId}/tepki`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ type }),
      });
      const data = await res.json();
      if (data?.ok) {
        setCounts(data.counts ?? {});
        setMine(data.myReaction ?? null);
      }
    } catch {
      // sessiz geç — tepki kritik değil
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-ink-200/70">
      <p className="mb-3 text-center text-sm font-bold text-ink-700">Bu habere tepkiniz?</p>
      <div className="flex flex-wrap items-center justify-center gap-2">
        {REACTION_TYPES.map((type) => {
          const meta = REACTION_META[type];
          const active = mine === type;
          return (
            <button
              key={type}
              type="button"
              onClick={() => react(type)}
              disabled={busy}
              aria-pressed={active}
              className={`flex min-w-16 flex-col items-center gap-0.5 rounded-xl px-3 py-2 text-xs font-semibold transition ${
                active
                  ? "bg-brand-600 text-white shadow"
                  : "bg-ink-100 text-ink-600 hover:bg-ink-200"
              }`}
            >
              <span className="text-xl leading-none">{meta.emoji}</span>
              <span>{meta.label}</span>
              <span className={active ? "text-white/90" : "text-ink-400"}>
                {counts[type] ?? 0}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
