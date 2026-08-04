"use client";

import { useEffect } from "react";

/**
 * Haber sayfası açıldığında görüntülenme kaydı atar.
 * Sunucu tarafında saymak yerine buradan yapıyoruz ki sayfa önbelleklenebilsin.
 */
export function ViewTracker({ articleId }: { articleId: string }) {
  useEffect(() => {
    // Aynı sekmede yenilemelerde tekrar saymamak için oturum işareti
    const key = `sdk_view_${articleId}`;
    if (sessionStorage.getItem(key)) return;
    sessionStorage.setItem(key, "1");

    const payload = JSON.stringify({
      referrer: document.referrer || null,
      path: window.location.pathname,
    });

    fetch(`/api/haber/${articleId}/goruntulendi`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: payload,
      keepalive: true,
    }).catch(() => {
      // İstatistik kaydı başarısız olursa okuyucuyu ilgilendirmez
    });
  }, [articleId]);

  return null;
}
