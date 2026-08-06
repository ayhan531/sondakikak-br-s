"use client";

import Link from "next/link";
import { useActionState } from "react";
import {
  readerLoginAction,
  readerRegisterAction,
  type ReaderFormState,
} from "./actions";

const initial: ReaderFormState = {};

const inputClass =
  "w-full rounded-lg border border-ink-300 bg-white px-3.5 py-2.5 text-sm text-ink-900 placeholder:text-ink-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-200";

function GoogleButton({ next }: { next: string }) {
  return (
    <a
      href={`/api/uye/google?next=${encodeURIComponent(next)}`}
      className="flex w-full items-center justify-center gap-2.5 rounded-lg border border-ink-300 bg-white py-2.5 text-sm font-bold text-ink-800 transition hover:bg-ink-50"
    >
      <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.27-4.74 3.27-8.1Z" />
        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23Z" />
        <path fill="#FBBC05" d="M5.84 14.1a6.6 6.6 0 0 1 0-4.2V7.06H2.18a11 11 0 0 0 0 9.88l3.66-2.84Z" />
        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15A10.97 10.97 0 0 0 12 1 11 11 0 0 0 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52Z" />
      </svg>
      Google ile devam et
    </a>
  );
}

export function LoginForm({ next, googleEnabled }: { next: string; googleEnabled: boolean }) {
  const [state, formAction, pending] = useActionState(readerLoginAction, initial);

  return (
    <div className="space-y-4">
      {googleEnabled && (
        <>
          <GoogleButton next={next} />
          <div className="flex items-center gap-3 text-xs font-semibold uppercase text-ink-400">
            <span className="h-px flex-1 bg-ink-200" /> veya <span className="h-px flex-1 bg-ink-200" />
          </div>
        </>
      )}

      <form action={formAction} className="space-y-4">
        {state.error && (
          <p role="alert" className="rounded-lg bg-brand-50 px-4 py-3 text-sm font-medium text-brand-700 ring-1 ring-brand-200">
            {state.error}
          </p>
        )}
        <input type="hidden" name="next" value={next} />
        <label className="block">
          <span className="mb-1.5 block text-sm font-semibold text-ink-700">E-posta</span>
          <input type="email" name="email" required className={inputClass} placeholder="ornek@eposta.com" />
        </label>
        <label className="block">
          <span className="mb-1.5 block text-sm font-semibold text-ink-700">Şifre</span>
          <input type="password" name="password" required className={inputClass} placeholder="••••••••" />
        </label>
        <button
          type="submit"
          disabled={pending}
          className="w-full rounded-lg bg-brand-600 py-3 text-sm font-bold text-white transition hover:bg-brand-700 disabled:opacity-60"
        >
          {pending ? "Giriş yapılıyor…" : "Giriş Yap"}
        </button>
      </form>

      <p className="text-center text-sm text-ink-500">
        Hesabınız yok mu?{" "}
        <Link href={`/uye/kayit?next=${encodeURIComponent(next)}`} className="font-bold text-brand-600 hover:underline">
          Ücretsiz kayıt olun
        </Link>
      </p>
    </div>
  );
}

export function RegisterForm({ next, googleEnabled }: { next: string; googleEnabled: boolean }) {
  const [state, formAction, pending] = useActionState(readerRegisterAction, initial);

  return (
    <div className="space-y-4">
      {googleEnabled && (
        <>
          <GoogleButton next={next} />
          <div className="flex items-center gap-3 text-xs font-semibold uppercase text-ink-400">
            <span className="h-px flex-1 bg-ink-200" /> veya <span className="h-px flex-1 bg-ink-200" />
          </div>
        </>
      )}

      <form action={formAction} className="space-y-4">
        {state.error && (
          <p role="alert" className="rounded-lg bg-brand-50 px-4 py-3 text-sm font-medium text-brand-700 ring-1 ring-brand-200">
            {state.error}
          </p>
        )}
        <input type="hidden" name="next" value={next} />
        <label className="block">
          <span className="mb-1.5 block text-sm font-semibold text-ink-700">Adınız</span>
          <input name="name" required minLength={2} maxLength={80} className={inputClass} placeholder="Adınız Soyadınız" />
        </label>
        <label className="block">
          <span className="mb-1.5 block text-sm font-semibold text-ink-700">E-posta</span>
          <input type="email" name="email" required className={inputClass} placeholder="ornek@eposta.com" />
        </label>
        <label className="block">
          <span className="mb-1.5 block text-sm font-semibold text-ink-700">Şifre</span>
          <input type="password" name="password" required minLength={8} className={inputClass} placeholder="En az 8 karakter" />
        </label>
        <button
          type="submit"
          disabled={pending}
          className="w-full rounded-lg bg-brand-600 py-3 text-sm font-bold text-white transition hover:bg-brand-700 disabled:opacity-60"
        >
          {pending ? "Kayıt yapılıyor…" : "Kayıt Ol"}
        </button>
      </form>

      <p className="text-center text-sm text-ink-500">
        Zaten hesabınız var mı?{" "}
        <Link href={`/uye/giris?next=${encodeURIComponent(next)}`} className="font-bold text-brand-600 hover:underline">
          Giriş yapın
        </Link>
      </p>
    </div>
  );
}
