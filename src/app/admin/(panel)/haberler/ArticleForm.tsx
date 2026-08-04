"use client";

import Image from "next/image";
import Link from "next/link";
import { useActionState, useRef, useState } from "react";
import { Card, Field, inputClass, selectClass } from "@/components/admin/ui";
import { saveArticleAction, type ArticleFormState } from "./actions";

export type ArticleFormData = {
  id?: string;
  slug?: string;
  title?: string;
  summary?: string;
  content?: string;
  imageLocal?: string | null;
  imageAlt?: string | null;
  categoryId?: string | null;
  status?: string;
  isBreaking?: boolean;
  isHeadline?: boolean;
  isFeatured?: boolean;
  order?: number;
  publishedAt?: string;
  metaTitle?: string | null;
  metaDescription?: string | null;
  keywords?: string | null;
  author?: string | null;
};

const initialState: ArticleFormState = {};

/** Metin alanında seçili kısmı HTML etiketiyle sarar. */
const TOOLBAR = [
  { label: "Kalın", open: "<strong>", close: "</strong>" },
  { label: "İtalik", open: "<em>", close: "</em>" },
  { label: "Ara Başlık", open: "<h2><strong>", close: "</strong></h2>" },
  { label: "Paragraf", open: "<p>", close: "</p>" },
  { label: "Alıntı", open: "<blockquote>", close: "</blockquote>" },
  { label: "Liste", open: "<ul><li>", close: "</li></ul>" },
] as const;

export function ArticleForm({
  article = {},
  categories,
}: {
  article?: ArticleFormData;
  categories: Array<{ id: string; name: string }>;
}) {
  const [state, formAction, pending] = useActionState(saveArticleAction, initialState);
  const contentRef = useRef<HTMLTextAreaElement>(null);
  const [preview, setPreview] = useState<string | null>(article.imageLocal ?? null);

  function wrapSelection(open: string, close: string) {
    const textarea = contentRef.current;
    if (!textarea) return;

    const { selectionStart, selectionEnd, value } = textarea;
    const selected = value.slice(selectionStart, selectionEnd);
    const next = value.slice(0, selectionStart) + open + selected + close + value.slice(selectionEnd);

    textarea.value = next;
    textarea.focus();
    textarea.setSelectionRange(selectionStart + open.length, selectionStart + open.length + selected.length);
  }

  return (
    <form action={formAction} className="grid gap-6 lg:grid-cols-3">
      {article.id && <input type="hidden" name="id" value={article.id} />}
      <input type="hidden" name="currentImage" value={preview ?? ""} />

      {/* Ana sütun */}
      <div className="space-y-6 lg:col-span-2">
        {state.error && (
          <p role="alert" className="rounded-lg bg-brand-50 px-4 py-3 text-sm font-medium text-brand-700 ring-1 ring-brand-200">
            {state.error}
          </p>
        )}
        {state.success && (
          <p className="rounded-lg bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700 ring-1 ring-emerald-200">
            {state.success}
          </p>
        )}

        <Card className="p-5">
          <Field label="Başlık *" className="mb-4">
            <input
              name="title"
              required
              minLength={5}
              defaultValue={article.title}
              placeholder="Haber başlığı"
              className={`${inputClass} text-lg font-bold`}
            />
          </Field>

          <Field
            label="URL (slug)"
            hint="Boş bırakırsanız başlıktan otomatik üretilir."
            className="mb-4"
          >
            <input
              name="slug"
              defaultValue={article.slug}
              placeholder="ornek-haber-basligi"
              className={inputClass}
            />
          </Field>

          <Field label="Özet" hint="Boş bırakılırsa metinden otomatik çıkarılır (kart ve arama sonuçlarında görünür).">
            <textarea
              name="summary"
              rows={3}
              defaultValue={article.summary}
              className={`${inputClass} resize-y`}
            />
          </Field>
        </Card>

        <Card className="p-5">
          <div className="mb-2 flex flex-wrap gap-1.5">
            {TOOLBAR.map((item) => (
              <button
                key={item.label}
                type="button"
                onClick={() => wrapSelection(item.open, item.close)}
                className="rounded bg-ink-100 px-2.5 py-1 text-xs font-bold text-ink-600 transition hover:bg-ink-200"
              >
                {item.label}
              </button>
            ))}
          </div>

          <Field
            label="Haber Metni * (HTML)"
            hint="Paragraflar <p> etiketiyle sarılmalıdır. Yukarıdaki düğmeler seçili metni biçimlendirir."
          >
            <textarea
              ref={contentRef}
              name="content"
              required
              rows={22}
              defaultValue={article.content}
              placeholder="<p>Haber metni…</p>"
              className={`${inputClass} resize-y font-mono text-[13px] leading-relaxed`}
            />
          </Field>
        </Card>

        <Card className="p-5" title="Arama Motoru Ayarları">
          <div className="space-y-4 pt-4">
            <Field label="SEO Başlığı" hint="60 karakteri geçmemeli. Boş bırakılırsa başlık kullanılır.">
              <input name="metaTitle" defaultValue={article.metaTitle ?? ""} maxLength={70} className={inputClass} />
            </Field>
            <Field label="SEO Açıklaması" hint="155 karakter civarı ideal. Google sonuçlarında görünür.">
              <textarea name="metaDescription" rows={2} defaultValue={article.metaDescription ?? ""} maxLength={200} className={`${inputClass} resize-y`} />
            </Field>
            <Field label="Anahtar Kelimeler" hint="Virgülle ayırın.">
              <input name="keywords" defaultValue={article.keywords ?? ""} placeholder="kıbrıs, lefkoşa, trafik" className={inputClass} />
            </Field>
          </div>
        </Card>
      </div>

      {/* Yan sütun */}
      <div className="space-y-6">
        <Card className="p-5">
          <button
            type="submit"
            disabled={pending}
            className="w-full rounded-lg bg-brand-600 py-3 text-sm font-bold text-white transition hover:bg-brand-700 disabled:opacity-60"
          >
            {pending ? "Kaydediliyor…" : article.id ? "Değişiklikleri Kaydet" : "Haberi Yayınla"}
          </button>

          {article.slug && (
            <Link
              href={`/haber/${article.slug}`}
              target="_blank"
              className="mt-2 block rounded-lg bg-ink-100 py-2.5 text-center text-sm font-bold text-ink-700 transition hover:bg-ink-200"
            >
              Sitede Görüntüle ↗
            </Link>
          )}
        </Card>

        <Card className="p-5" title="Yayın">
          <div className="space-y-4 pt-4">
            <Field label="Durum">
              <select name="status" defaultValue={article.status ?? "published"} className={selectClass}>
                <option value="published">Yayında</option>
                <option value="draft">Taslak</option>
                <option value="archived">Arşiv</option>
              </select>
            </Field>

            <Field label="Kategori">
              <select name="categoryId" defaultValue={article.categoryId ?? ""} className={selectClass}>
                <option value="">Kategorisiz</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>{category.name}</option>
                ))}
              </select>
            </Field>

            <Field label="Yayın Tarihi">
              <input
                type="datetime-local"
                name="publishedAt"
                defaultValue={article.publishedAt}
                className={inputClass}
              />
            </Field>

            <Field label="Haber Kaynağı / Muhabir">
              <input name="author" defaultValue={article.author ?? ""} className={inputClass} />
            </Field>

            <div className="space-y-2.5 border-t border-ink-200 pt-4">
              {[
                { name: "isBreaking", label: "Son dakika bandında göster", checked: article.isBreaking },
                { name: "isHeadline", label: "Manşete al", checked: article.isHeadline },
                { name: "isFeatured", label: "Öne çıkar", checked: article.isFeatured },
              ].map((item) => (
                <label key={item.name} className="flex items-center gap-2.5 text-sm font-medium text-ink-700">
                  <input
                    type="checkbox"
                    name={item.name}
                    defaultChecked={item.checked}
                    className="h-4 w-4 rounded border-ink-300 text-brand-600 focus:ring-brand-500"
                  />
                  {item.label}
                </label>
              ))}
            </div>

            <Field label="Sıra" hint="Manşette küçük sayı önce gösterilir.">
              <input type="number" name="order" defaultValue={article.order ?? 0} className={inputClass} />
            </Field>
          </div>
        </Card>

        <Card className="p-5" title="Görsel">
          <div className="space-y-3 pt-4">
            {preview && (
              <div className="relative aspect-video overflow-hidden rounded-lg bg-ink-100">
                <Image src={preview} alt="Önizleme" fill sizes="320px" className="object-cover" />
              </div>
            )}

            <input
              type="file"
              name="image"
              accept="image/*"
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (file) setPreview(URL.createObjectURL(file));
              }}
              className="w-full text-sm text-ink-600 file:mr-3 file:rounded-lg file:border-0 file:bg-ink-900 file:px-3 file:py-2 file:text-xs file:font-bold file:text-white"
            />

            {preview && (
              <button
                type="button"
                onClick={() => setPreview(null)}
                className="text-xs font-bold text-brand-600 hover:underline"
              >
                Görseli kaldır
              </button>
            )}

            <Field label="Görsel Açıklaması (alt)">
              <input name="imageAlt" defaultValue={article.imageAlt ?? ""} className={inputClass} />
            </Field>
          </div>
        </Card>
      </div>
    </form>
  );
}
