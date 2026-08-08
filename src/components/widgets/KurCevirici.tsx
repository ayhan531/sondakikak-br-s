"use client";

import { useState } from "react";
import { ArrowLeftRight } from "lucide-react";

type ConverterRate = { code: string; name: string; selling: number };

/** TL tabanlı döviz çevirici; kur listesi sunucudan gelir (canlı veri). */
export function KurCevirici({ rates }: { rates: ConverterRate[] }) {
  const options = [{ code: "TRY", name: "Türk Lirası", selling: 1 }, ...rates];
  const [amount, setAmount] = useState("100");
  const [from, setFrom] = useState("USD");
  const [to, setTo] = useState("TRY");

  const fromRate = options.find((o) => o.code === from)?.selling ?? 1;
  const toRate = options.find((o) => o.code === to)?.selling ?? 1;
  const parsed = Number.parseFloat(amount.replace(",", "."));
  const result = Number.isFinite(parsed) ? (parsed * fromRate) / toRate : null;

  const swap = () => {
    setFrom(to);
    setTo(from);
  };

  const selectClass =
    "w-full rounded-lg border border-ink-200 bg-white px-2 py-1.5 text-xs font-semibold text-ink-900 focus:border-brand-600 focus:outline-none";

  return (
    <div className="mt-4 rounded-lg bg-ink-50 p-3">
      <p className="mb-2 text-xs font-black uppercase tracking-wide text-ink-500">Döviz Çevirici</p>
      <div className="flex items-center gap-2">
        <input
          type="text"
          inputMode="decimal"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          aria-label="Miktar"
          className="w-24 rounded-lg border border-ink-200 bg-white px-2 py-1.5 text-xs font-semibold text-ink-900 focus:border-brand-600 focus:outline-none"
        />
        <select value={from} onChange={(e) => setFrom(e.target.value)} aria-label="Kaynak para birimi" className={selectClass}>
          {options.map((o) => (
            <option key={o.code} value={o.code}>
              {o.code}
            </option>
          ))}
        </select>
        <button
          type="button"
          onClick={swap}
          aria-label="Birimleri değiştir"
          className="shrink-0 rounded-lg border border-ink-200 bg-white px-2 py-2 text-ink-600 transition hover:border-brand-600 hover:text-brand-600"
        >
          <ArrowLeftRight className="h-3.5 w-3.5" aria-hidden="true" />
        </button>
        <select value={to} onChange={(e) => setTo(e.target.value)} aria-label="Hedef para birimi" className={selectClass}>
          {options.map((o) => (
            <option key={o.code} value={o.code}>
              {o.code}
            </option>
          ))}
        </select>
      </div>
      <p className="mt-2 text-sm font-black text-ink-900">
        {result === null
          ? "Geçerli bir miktar girin"
          : `${new Intl.NumberFormat("tr-TR", { maximumFractionDigits: 2 }).format(result)} ${to}`}
      </p>
    </div>
  );
}
