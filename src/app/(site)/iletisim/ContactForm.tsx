"use client";

import { useActionState } from "react";
import { sendContactMessageAction, type ContactFormState } from "./actions";

const initial: ContactFormState = {};

const inputClass =
  "w-full rounded-lg border border-ink-300 bg-white px-3.5 py-2.5 text-sm text-ink-900 placeholder:text-ink-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-200";

export function ContactForm() {
  const [state, formAction, pending] = useActionState(sendContactMessageAction, initial);

  if (state.success) {
    return (
      <div className="rounded-xl bg-emerald-50 p-6 text-center ring-1 ring-emerald-200">
        <p className="text-lg font-bold text-emerald-800">Teşekkürler! 🎉</p>
        <p className="mt-1 text-sm text-emerald-700">{state.success}</p>
      </div>
    );
  }

  return (
    <form action={formAction} className="space-y-4">
      {state.error && (
        <p role="alert" className="rounded-lg bg-brand-50 px-4 py-3 text-sm font-medium text-brand-700 ring-1 ring-brand-200">
          {state.error}
        </p>
      )}

      {/* Bal küpü — insanlar görmez, botlar doldurur */}
      <input
        type="text"
        name="website"
        tabIndex={-1}
        autoComplete="off"
        aria-hidden="true"
        className="hidden"
      />

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block">
          <span className="mb-1.5 block text-sm font-semibold text-ink-700">Adınız Soyadınız *</span>
          <input name="name" required minLength={2} maxLength={120} className={inputClass} placeholder="Adınız" />
        </label>
        <label className="block">
          <span className="mb-1.5 block text-sm font-semibold text-ink-700">E-posta *</span>
          <input type="email" name="email" required maxLength={200} className={inputClass} placeholder="ornek@eposta.com" />
        </label>
        <label className="block">
          <span className="mb-1.5 block text-sm font-semibold text-ink-700">Telefon</span>
          <input type="tel" name="phone" maxLength={40} className={inputClass} placeholder="+90 5xx xxx xx xx" />
        </label>
        <label className="block">
          <span className="mb-1.5 block text-sm font-semibold text-ink-700">Konu</span>
          <select name="subject" className={inputClass} defaultValue="Genel">
            <option>Genel</option>
            <option>Haber İhbarı</option>
            <option>Düzeltme Talebi</option>
            <option>Reklam ve İş Birliği</option>
            <option>Şikayet</option>
          </select>
        </label>
      </div>

      <label className="block">
        <span className="mb-1.5 block text-sm font-semibold text-ink-700">Mesajınız *</span>
        <textarea
          name="message"
          required
          minLength={10}
          maxLength={5000}
          rows={6}
          className={inputClass}
          placeholder="Mesajınızı buraya yazın…"
        />
      </label>

      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-lg bg-brand-600 py-3 text-sm font-bold text-white shadow transition hover:bg-brand-700 disabled:opacity-60 sm:w-auto sm:px-10"
      >
        {pending ? "Gönderiliyor…" : "Mesajı Gönder"}
      </button>
    </form>
  );
}
