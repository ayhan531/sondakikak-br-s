"use client";

import { useState } from "react";

const BUTTONS = [
  {
    key: "whatsapp",
    label: "WhatsApp",
    className: "bg-[#25D366]",
    href: (url: string, title: string) =>
      `https://wa.me/?text=${encodeURIComponent(`${title} ${url}`)}`,
    path: "M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2Zm5.6 14.1c-.2.7-1.4 1.3-1.9 1.3-.5 0-.6.4-3.7-.9-3.1-1.4-5-4.6-5.2-4.8-.2-.2-1.3-1.7-1.3-3.2S6.3 6.3 6.6 6c.2-.3.5-.3.7-.3h.5c.2 0 .4-.1.7.5l.9 2.1c.1.2.1.4 0 .6l-.4.5c-.1.2-.3.3-.1.6.2.3.8 1.3 1.7 2.1 1.2 1 2.1 1.4 2.4 1.5.3.1.4.1.6-.1l.8-1c.2-.2.4-.2.6-.1l2 1c.3.1.4.2.5.3.1.2.1.7-.1 1.4Z",
  },
  {
    key: "facebook",
    label: "Facebook",
    className: "bg-[#1877F2]",
    href: (url: string) => `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
    path: "M13.5 9H16V6h-2.5C11.6 6 10 7.6 10 9.5V11H8v3h2v7h3v-7h2.2l.4-3H13v-1.2c0-.5.2-.8.5-.8Z",
  },
  {
    key: "twitter",
    label: "X",
    className: "bg-ink-900",
    href: (url: string, title: string) =>
      `https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(title)}`,
    path: "M17.5 4h2.7l-5.9 6.7L21 20h-5.4l-4.2-5.5L6.6 20H3.9l6.3-7.2L3 4h5.5l3.8 5.1L17.5 4Zm-1 14.3h1.5L8.6 5.6H7l8.5 12.7Z",
  },
  {
    key: "telegram",
    label: "Telegram",
    className: "bg-[#26A5E4]",
    href: (url: string, title: string) =>
      `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(title)}`,
    path: "M21.9 4.3 18.8 19c-.2 1-.9 1.3-1.7.8l-4.8-3.5-2.3 2.2c-.3.3-.5.5-1 .5l.3-4.9L18.1 6c.4-.3-.1-.5-.6-.2L6.6 12.6l-4.7-1.5c-1-.3-1-1 .2-1.5l18.4-7.1c.9-.3 1.6.2 1.4 1.8Z",
  },
] as const;

export function ShareButtons({ url, title }: { url: string; title: string }) {
  const [copied, setCopied] = useState(false);

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="mr-1 text-xs font-bold uppercase tracking-wide text-ink-500">Paylaş</span>

      {BUTTONS.map((button) => (
        <a
          key={button.key}
          href={button.href(url, title)}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`${button.label} ile paylaş`}
          className={`flex h-9 w-9 items-center justify-center rounded-full text-white transition hover:opacity-85 ${button.className}`}
        >
          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor" aria-hidden="true">
            <path d={button.path} />
          </svg>
        </a>
      ))}

      <button
        type="button"
        onClick={async () => {
          try {
            await navigator.clipboard.writeText(url);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
          } catch {
            setCopied(false);
          }
        }}
        aria-label="Bağlantıyı kopyala"
        className="flex h-9 items-center gap-1.5 rounded-full bg-ink-200 px-3 text-xs font-bold text-ink-700 transition hover:bg-ink-300"
      >
        <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" aria-hidden="true">
          <path
            d="M9 9V6a2 2 0 0 1 2-2h7a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2h-3M6 9h7a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2Z"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        {copied ? "Kopyalandı" : "Kopyala"}
      </button>
    </div>
  );
}
