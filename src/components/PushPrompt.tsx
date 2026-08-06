"use client";

import { useEffect, useState } from "react";

function base64ToUint8Array(base64: string): Uint8Array<ArrayBuffer> {
  const padding = "=".repeat((4 - (base64.length % 4)) % 4);
  const normalized = (base64 + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(normalized);
  const bytes = new Uint8Array(new ArrayBuffer(raw.length));
  for (let i = 0; i < raw.length; i++) bytes[i] = raw.charCodeAt(i);
  return bytes;
}

type Status = "loading" | "unsupported" | "off" | "on" | "denied";

/** Sağ altta bildirim aboneliği düğmesi. */
export function PushPrompt() {
  const [status, setStatus] = useState<Status>("loading");
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
      setStatus("unsupported");
      return;
    }
    if (Notification.permission === "denied") {
      setStatus("denied");
      return;
    }
    if (localStorage.getItem("sdk_push_kapali") === "1") setDismissed(true);

    navigator.serviceWorker
      .register("/sw.js")
      .then((registration) => registration.pushManager.getSubscription())
      .then((subscription) => setStatus(subscription ? "on" : "off"))
      .catch(() => setStatus("unsupported"));
  }, []);

  const subscribe = async () => {
    try {
      const keyRes = await fetch("/api/push/abone");
      const { ok, key } = await keyRes.json();
      if (!ok || !key) return;

      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: base64ToUint8Array(key),
      });

      await fetch("/api/push/abone", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(subscription.toJSON()),
      });
      setStatus("on");
    } catch {
      if (Notification.permission === "denied") setStatus("denied");
    }
  };

  const unsubscribe = async () => {
    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      if (subscription) {
        await fetch("/api/push/abone", {
          method: "DELETE",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ endpoint: subscription.endpoint }),
        });
        await subscription.unsubscribe();
      }
      setStatus("off");
    } catch {
      // yut
    }
  };

  if (status === "loading" || status === "unsupported" || status === "denied") return null;

  // Kapatılmışsa yalnızca küçük zil göster
  if (status === "off" && dismissed) {
    return (
      <button
        type="button"
        onClick={subscribe}
        aria-label="Bildirimleri aç"
        title="Bildirimleri aç"
        className="fixed bottom-4 right-4 z-40 flex h-11 w-11 items-center justify-center rounded-full bg-ink-900 text-white shadow-lg transition hover:bg-brand-600"
      >
        🔔
      </button>
    );
  }

  if (status === "off") {
    return (
      <div className="fixed bottom-4 right-4 z-40 w-72 rounded-xl bg-white p-4 shadow-xl ring-1 ring-ink-200">
        <p className="text-sm font-bold text-ink-900">🔔 Son dakikayı kaçırmayın</p>
        <p className="mt-1 text-xs leading-relaxed text-ink-500">
          Yeni haberlerde anında bildirim alın. İstediğiniz zaman kapatabilirsiniz.
        </p>
        <div className="mt-3 flex items-center gap-2">
          <button
            type="button"
            onClick={subscribe}
            className="flex-1 rounded-lg bg-brand-600 py-2 text-xs font-bold text-white transition hover:bg-brand-700"
          >
            Bildirimleri Aç
          </button>
          <button
            type="button"
            onClick={() => {
              localStorage.setItem("sdk_push_kapali", "1");
              setDismissed(true);
            }}
            className="rounded-lg bg-ink-100 px-3 py-2 text-xs font-bold text-ink-600 transition hover:bg-ink-200"
          >
            Şimdi değil
          </button>
        </div>
      </div>
    );
  }

  // status === "on": abonelikten çıkma imkânı (küçük, göze batmayan)
  return (
    <button
      type="button"
      onClick={unsubscribe}
      aria-label="Bildirimleri kapat"
      title="Bildirimler açık — kapatmak için tıklayın"
      className="fixed bottom-4 right-4 z-40 flex h-11 w-11 items-center justify-center rounded-full bg-emerald-600 text-white shadow-lg transition hover:bg-ink-700"
    >
      🔔
    </button>
  );
}
