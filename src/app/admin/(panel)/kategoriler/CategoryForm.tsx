"use client";

import { useActionState, useState } from "react";
import { Card, Field, inputClass, textareaClass } from "@/components/admin/ui";
import { saveCategoryAction, type CategoryFormState } from "./actions";

export type CategoryFormData = {
  id?: string;
  name?: string;
  slug?: string;
  description?: string | null;
  color?: string;
  order?: number;
  isActive?: boolean;
  showInMenu?: boolean;
  metaTitle?: string | null;
  metaDescription?: string | null;
};

const initialState: CategoryFormState = {};

function CategoryFields({
  category = {},
  onDone,
}: {
  category?: CategoryFormData;
  onDone?: () => void;
}) {
  const [state, formAction, pending] = useActionState(saveCategoryAction, initialState);

  return (
    <form action={formAction} className="space-y-4">
      {category.id && <input type="hidden" name="id" value={category.id} />}

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
        <Field label="Kategori Adı *">
          <input name="name" required defaultValue={category.name} className={inputClass} />
        </Field>
        <Field label="Adres (slug)" hint="Boşsa addan üretilir.">
          <input name="slug" defaultValue={category.slug} className={inputClass} />
        </Field>
      </div>

      <Field label="Açıklama" hint="Kategori sayfasının üstünde ve arama sonuçlarında görünür.">
        <textarea name="description" rows={2} defaultValue={category.description ?? ""} className={`${textareaClass} min-h-0`} />
      </Field>

      <div className="grid gap-4 sm:grid-cols-3">
        <Field label="Renk">
          <input type="color" name="color" defaultValue={category.color ?? "#dc2626"} className="h-11 w-full cursor-pointer rounded-lg border border-ink-200" />
        </Field>
        <Field label="Sıra">
          <input type="number" name="order" defaultValue={category.order ?? 0} className={inputClass} />
        </Field>
        <div className="flex flex-col justify-center gap-2 pt-5">
          <label className="flex items-center gap-2 text-sm font-medium text-ink-700">
            <input type="checkbox" name="isActive" defaultChecked={category.isActive ?? true} className="h-4 w-4 rounded border-ink-300 text-brand-600" />
            Aktif
          </label>
          <label className="flex items-center gap-2 text-sm font-medium text-ink-700">
            <input type="checkbox" name="showInMenu" defaultChecked={category.showInMenu ?? true} className="h-4 w-4 rounded border-ink-300 text-brand-600" />
            Menüde göster
          </label>
        </div>
      </div>

      <div className="grid gap-4 border-t border-ink-200 pt-4 sm:grid-cols-2">
        <Field label="SEO Başlığı">
          <input name="metaTitle" defaultValue={category.metaTitle ?? ""} className={inputClass} />
        </Field>
        <Field label="SEO Açıklaması">
          <input name="metaDescription" defaultValue={category.metaDescription ?? ""} className={inputClass} />
        </Field>
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
          <button type="button" onClick={onDone} className="rounded-lg bg-ink-100 px-5 py-2.5 text-sm font-bold text-ink-700 transition hover:bg-ink-200">
            Kapat
          </button>
        )}
      </div>
    </form>
  );
}

export function CategoryEditor({ category }: { category: CategoryFormData }) {
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
          <CategoryFields category={category} onDone={() => setOpen(false)} />
        </div>
      )}
    </>
  );
}

export function NewCategoryPanel() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-brand-700"
      >
        {open ? "İptal" : "+ Yeni Kategori"}
      </button>

      {open && (
        <Card className="mt-4 p-5">
          <CategoryFields onDone={() => setOpen(false)} />
        </Card>
      )}
    </>
  );
}
