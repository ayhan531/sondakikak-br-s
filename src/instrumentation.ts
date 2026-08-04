/**
 * Sunucu ayağa kalkarken bir kez çalışır.
 * 1) Veritabanı ilk kurulumunu tamamlar (yönetici, kategoriler, kaynaklar).
 * 2) İstenirse otomatik haber çekme zamanlayıcısını başlatır.
 */
export async function register() {
  // Yalnızca Node.js çalışma zamanında (Edge derlemesinde değil)
  if (process.env.NEXT_RUNTIME !== "nodejs") return;

  const { ensureBootstrap } = await import("@/lib/bootstrap");

  try {
    await ensureBootstrap();
  } catch (error) {
    console.error("[bootstrap] İlk kurulum başarısız:", error);
  }

  // Zamanlayıcı yalnızca açıkça istendiğinde çalışır; geliştirme sırasında
  // her yeniden derlemede kaynak sitelere gitmesini istemiyoruz.
  const minutes = Number(process.env.FETCH_INTERVAL_MINUTES ?? 0);
  if (!Number.isFinite(minutes) || minutes < 5) return;

  const { runAllSources } = await import("@/lib/scraper");
  const { getSettings, isTrue } = await import("@/lib/settings");

  let running = false;
  const tick = async () => {
    if (running) return;
    running = true;
    try {
      const settings = await getSettings();
      if (!isTrue(settings.autoFetchEnabled)) return;

      const summary = await runAllSources();
      console.log(
        `[zamanlayıcı] ${summary.created} yeni haber eklendi (${summary.sources} kaynak).`
      );
    } catch (error) {
      console.error("[zamanlayıcı] Haber çekme hatası:", error);
    } finally {
      running = false;
    }
  };

  console.log(`[zamanlayıcı] Otomatik haber çekme her ${minutes} dakikada bir çalışacak.`);

  // İlk çekimi sunucu tam ayağa kalksın diye biraz geciktiriyoruz
  setTimeout(tick, 30_000);
  setInterval(tick, minutes * 60_000);
}
