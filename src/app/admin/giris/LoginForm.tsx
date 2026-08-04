"use client";

import { useActionState } from "react";
import { LogoMark } from "@/components/Logo";
import { loginAction, type LoginState } from "./actions";

const initialState: LoginState = {};

export function LoginForm() {
  const [state, formAction, pending] = useActionState(loginAction, initialState);

  return (
    <div className="w-full max-w-sm">
      <div className="mb-6 flex flex-col items-center gap-3">
        <LogoMark className="h-14 w-14" />
        <div className="text-center">
          <h1 className="text-xl font-black text-ink-900">
            sondakika<span className="text-brand-600">kıbrıs</span>
          </h1>
          <p className="mt-0.5 text-xs font-semibold uppercase tracking-widest text-ink-500">
            Yönetim Paneli
          </p>
        </div>
      </div>

      <form
        action={formAction}
        className="space-y-4 rounded-2xl bg-white p-6 shadow-lg ring-1 ring-ink-200/70"
      >
        {state.error && (
          <p
            role="alert"
            className="rounded-lg bg-brand-50 px-3 py-2.5 text-sm font-medium text-brand-700 ring-1 ring-brand-200"
          >
            {state.error}
          </p>
        )}

        <div>
          <label htmlFor="email" className="mb-1.5 block text-sm font-semibold text-ink-700">
            E-posta
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            autoComplete="username"
            className="w-full rounded-lg border border-ink-200 px-3 py-2.5 text-sm outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
          />
        </div>

        <div>
          <label htmlFor="password" className="mb-1.5 block text-sm font-semibold text-ink-700">
            Şifre
          </label>
          <input
            id="password"
            name="password"
            type="password"
            required
            autoComplete="current-password"
            className="w-full rounded-lg border border-ink-200 px-3 py-2.5 text-sm outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
          />
        </div>

        <button
          type="submit"
          disabled={pending}
          className="w-full rounded-lg bg-brand-600 py-2.5 text-sm font-bold text-white transition hover:bg-brand-700 disabled:opacity-60"
        >
          {pending ? "Giriş yapılıyor…" : "Giriş Yap"}
        </button>
      </form>
    </div>
  );
}
