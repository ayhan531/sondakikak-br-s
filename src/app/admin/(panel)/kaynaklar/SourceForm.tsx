"use client";

import { useActionState, useState } from "react";
import { Card, Field, inputClass, selectClass, textareaClass } from "@/components/admin/ui";
import { saveSourceAction, type SourceFormState } from "./actions";

export type SourceFormData = {
  id?: string;
  name?: string;
  homepage?: string;
  mode?: string;
  feedUrl?: string | null;
  crawlUrls?: string;
  linkPattern?: string | null;
  defaultCategorySlug?: string;
  maxPerRun?: number;
  priority?: number;
  isActive?: boolean;
  autoPublish?: boolean;
};

const initialState: SourceFormState = {};

/** Yalnızca bu dosyadaki panellerden kullanılır (sunucudan doğrudan çağrılmaz). */
function SourceForm({
  source = {},
  categories,
  onDone,
}: {
  source?: SourceFormData;
  categories: Array<{ slug: string; name: string }>;
  onDone?: () => void;
}) {
  const [state, formAction, pending] = useActionState(saveSourceAction, initialState);
  const [mode, setMode] = useState(source.mode ?? "rss");

  let crawlUrlsText = "";
  try {
    crawlUrlsText = (JSON.parse(source.crawlUrls ?? "[]") as string[]).join("\n");
  } catch {
    crawlUrlsText = "";
  }

  return (
    <form action={formAction} className="space-y-4">
      {source.id && <input type="hidden" name="id" value={source.id} />}

      {state.error && (
        <p role="alert" className="rounded-lg bg-brand-50 px-3 py-2.5 text-sm font-medium text-brand-700 ring-1 ring-brand-200">
          {state.error}
        </p>
      )}
      {state.success && (
        <p className="rounded-lg bg-emerald-50 px-3 py-2.5 text-sm font-medium text-emerald-700 ring-1 ring-emerald-200">
          {state.success}
        </p>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Kaynak Adı *">
          <input name="name" required defaultValue={source.name} className={inputClass} />
        </Field>
        <Field label="Site Adresi *">
          <input name="homepage" required defaultValue={source.homepage} placeholder="https://ornek.com" className={inputClass} />
        </Field>
      </div>

      <Field label="Çekim Yöntemi">
        <select
          name="mode"
          value={mode}
          onChange={(event) => setMode(event.target.value)}
          className={selectClass}
        >
          <option value="rss">RSS beslemesi (önerilen)</option>
          <option value="crawl">Sayfa tarama (RSS yoksa)</option>
        </select>
      </Field>

      {mode === "rss" ? (
        <Field label="RSS Adresi *" hint="Örn: https://ornek.com/rss">
          <input name="feedUrl" defaultValue={source.feedUrl ?? ""} className={inputClass} />
        </Field>
      ) : (
        <>
          <Field label="Taranacak Liste Sayfaları *" hint="Her satıra bir adres yazın (kategori sayfaları).">
            <textarea name="crawlUrls" rows={5} defaultValue={crawlUrlsText} className={textareaClass} />
          </Field>
          <Field
            label="Haber Bağlantısı Deseni *"
            hint="Haber sayfalarını tanıyan düzenli ifade. Örn: ornek\\.com/c\\d+-[^/]+/n\\d+-"
          >
            <input name="linkPattern" defaultValue={source.linkPattern ?? ""} className={`${inputClass} font-mono text-xs`} />
          </Field>
        </>
      )}

      <div className="grid gap-4 sm:grid-cols-3">
        <Field label="Varsayılan Kategori" hint="Eşleşme bulunamazsa kullanılır.">
          <select name="defaultCategorySlug" defaultValue={source.defaultCategorySlug ?? "kibris"} className={selectClass}>
            {categories.map((category) => (
              <option key={category.slug} value={category.slug}>{category.name}</option>
            ))}
          </select>
        </Field>
        <Field label="Turda En Fazla" hint="1-60 arası haber.">
          <input type="number" name="maxPerRun" min={1} max={60} defaultValue={source.maxPerRun ?? 15} className={inputClass} />
        </Field>
        <Field label="Öncelik" hint="Yüksek olan önce çekilir.">
          <input type="number" name="priority" defaultValue={source.priority ?? 0} className={inputClass} />
        </Field>
      </div>

      <div className="flex flex-wrap gap-5 border-t border-ink-200 pt-4">
        <label className="flex items-center gap-2.5 text-sm font-medium text-ink-700">
          <input
            type="checkbox"
            name="isActive"
            defaultChecked={source.isActive ?? true}
            className="h-4 w-4 rounded border-ink-300 text-brand-600 focus:ring-brand-500"
          />
          Kaynak aktif
        </label>
        <label className="flex items-center gap-2.5 text-sm font-medium text-ink-700">
          <input
            type="checkbox"
            name="autoPublish"
            defaultChecked={source.autoPublish ?? true}
            className="h-4 w-4 rounded border-ink-300 text-brand-600 focus:ring-brand-500"
          />
          Çekilen haberler otomatik yayınlansın
        </label>
      </div>

      <div className="flex gap-2">
        <button
          type="submit"
          disabled={pending}
          className="rounded-lg bg-brand-600 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-brand-700 disabled:opacity-60"
        >
          {pending ? "Kaydediliyor…" : "Kaydet"}
        </button>
        {onDone && (
          <button
            type="button"
            onClick={onDone}
            className="rounded-lg bg-ink-100 px-5 py-2.5 text-sm font-bold text-ink-700 transition hover:bg-ink-200"
          >
            Kapat
          </button>
        )}
      </div>
    </form>
  );
}

/** Listedeki her kaynağı açılır panelde düzenlemek için. */
export function SourceEditor({
  source,
  categories,
}: {
  source: SourceFormData;
  categories: Array<{ slug: string; name: string }>;
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="rounded bg-ink-100 px-2.5 py-1 text-[11px] font-bold text-ink-600 transition hover:bg-ink-200"
      >
        {open ? "Kapat" : "Düzenle"}
      </button>

      {open && (
        <div className="mt-3 w-full rounded-lg bg-ink-50 p-4 ring-1 ring-ink-200">
          <SourceForm source={source} categories={categories} onDone={() => setOpen(false)} />
        </div>
      )}
    </>
  );
}

export function NewSourcePanel({ categories }: { categories: Array<{ slug: string; name: string }> }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-brand-700"
      >
        {open ? "İptal" : "+ Yeni Kaynak"}
      </button>

      {open && (
        <Card className="mt-4 p-5">
          <SourceForm categories={categories} onDone={() => setOpen(false)} />
        </Card>
      )}
    </>
  );
}
