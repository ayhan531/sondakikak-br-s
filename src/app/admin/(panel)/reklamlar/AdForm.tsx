"use client";

import Image from "next/image";
import { useActionState, useState } from "react";
import { Card, Field, inputClass, selectClass, textareaClass } from "@/components/admin/ui";
import { saveAdAction, type AdFormState } from "./actions";

export type AdFormData = {
  id?: string;
  name?: string;
  placement?: string;
  type?: string;
  htmlCode?: string | null;
  imageUrl?: string | null;
  imageUrlMobile?: string | null;
  linkUrl?: string | null;
  altText?: string | null;
  isActive?: boolean;
  order?: number;
  startsAt?: string;
  endsAt?: string;
};

const initialState: AdFormState = {};

function AdFields({
  ad = {},
  placements,
  onDone,
}: {
  ad?: AdFormData;
  placements: Array<[string, string]>;
  onDone?: () => void;
}) {
  const [state, formAction, pending] = useActionState(saveAdAction, initialState);
  const [type, setType] = useState(ad.type ?? "image");
  const [preview, setPreview] = useState<string | null>(ad.imageUrl ?? null);
  const [previewMobile, setPreviewMobile] = useState<string | null>(ad.imageUrlMobile ?? null);

  return (
    <form action={formAction} className="space-y-4">
      {ad.id && <input type="hidden" name="id" value={ad.id} />}
      <input type="hidden" name="currentImage" value={ad.imageUrl ?? ""} />
      <input type="hidden" name="currentImageMobile" value={ad.imageUrlMobile ?? ""} />

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
        <Field label="Reklam Adı *" hint="Sadece panelde görünür.">
          <input name="name" required defaultValue={ad.name} className={inputClass} />
        </Field>

        <Field label="Konum *">
          <select name="placement" defaultValue={ad.placement ?? "sidebar-top"} className={selectClass}>
            {placements.map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
        </Field>
      </div>

      <Field label="Reklam Türü">
        <select
          name="type"
          value={type}
          onChange={(event) => setType(event.target.value)}
          className={selectClass}
        >
          <option value="image">Görsel + Bağlantı</option>
          <option value="html">HTML / Reklam Kodu (AdSense vb.)</option>
        </select>
      </Field>

      {type === "html" ? (
        <Field
          label="Reklam Kodu *"
          hint="Google AdSense veya başka bir ağdan aldığınız kodu buraya yapıştırın."
        >
          <textarea
            name="htmlCode"
            rows={7}
            defaultValue={ad.htmlCode ?? ""}
            className={`${textareaClass} font-mono text-xs`}
          />
        </Field>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Field label="Masaüstü Görseli *">
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
            </Field>
            {preview && (
              <div className="relative mt-2 aspect-[4/1] overflow-hidden rounded-lg bg-ink-100">
                <Image src={preview} alt="Önizleme" fill sizes="400px" className="object-contain" unoptimized />
              </div>
            )}
          </div>

          <div>
            <Field label="Mobil Görseli" hint="İsteğe bağlı. Boş bırakılırsa masaüstü görseli kullanılır.">
              <input
                type="file"
                name="imageMobile"
                accept="image/*"
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  if (file) setPreviewMobile(URL.createObjectURL(file));
                }}
                className="w-full text-sm text-ink-600 file:mr-3 file:rounded-lg file:border-0 file:bg-ink-900 file:px-3 file:py-2 file:text-xs file:font-bold file:text-white"
              />
            </Field>
            {previewMobile && (
              <div className="relative mt-2 aspect-[4/3] overflow-hidden rounded-lg bg-ink-100">
                <Image src={previewMobile} alt="Mobil önizleme" fill sizes="300px" className="object-contain" unoptimized />
              </div>
            )}
          </div>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Hedef Adres" hint="Reklama tıklanınca gidilecek adres.">
          <input name="linkUrl" defaultValue={ad.linkUrl ?? ""} placeholder="https://reklamveren.com" className={inputClass} />
        </Field>
        <Field label="Görsel Açıklaması (alt)">
          <input name="altText" defaultValue={ad.altText ?? ""} className={inputClass} />
        </Field>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Field label="Başlangıç Tarihi" hint="Boşsa hemen başlar.">
          <input type="datetime-local" name="startsAt" defaultValue={ad.startsAt} className={inputClass} />
        </Field>
        <Field label="Bitiş Tarihi" hint="Boşsa süresiz.">
          <input type="datetime-local" name="endsAt" defaultValue={ad.endsAt} className={inputClass} />
        </Field>
        <Field label="Sıra" hint="Aynı konumda küçük sayı önce gösterilir.">
          <input type="number" name="order" defaultValue={ad.order ?? 0} className={inputClass} />
        </Field>
      </div>

      <label className="flex items-center gap-2.5 border-t border-ink-200 pt-4 text-sm font-medium text-ink-700">
        <input
          type="checkbox"
          name="isActive"
          defaultChecked={ad.isActive ?? true}
          className="h-4 w-4 rounded border-ink-300 text-brand-600 focus:ring-brand-500"
        />
        Reklam yayında
      </label>

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

export function AdEditor({
  ad,
  placements,
}: {
  ad: AdFormData;
  placements: Array<[string, string]>;
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
          <AdFields ad={ad} placements={placements} onDone={() => setOpen(false)} />
        </div>
      )}
    </>
  );
}

export function NewAdPanel({ placements }: { placements: Array<[string, string]> }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-brand-700"
      >
        {open ? "İptal" : "+ Yeni Reklam"}
      </button>

      {open && (
        <Card className="mt-4 p-5">
          <AdFields placements={placements} onDone={() => setOpen(false)} />
        </Card>
      )}
    </>
  );
}
