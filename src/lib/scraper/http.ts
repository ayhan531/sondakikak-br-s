/** Kaynak sitelere yapılan tüm istekler buradan geçer: ortak başlıklar, zaman aşımı, yeniden deneme. */

const USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36";

// Kıbrıs'taki bazı sunucular yoğun saatlerde yavaş yanıt veriyor; cömert davranıyoruz.
export const DEFAULT_TIMEOUT = 45_000;

export type FetchTextResult = {
  ok: boolean;
  status: number;
  url: string;
  body: string;
  error?: string;
};

/** Kaynak sunucuyu yormamak için istekler arasında bekleme. */
export function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function once(url: string, timeout: number, accept: string): Promise<FetchTextResult> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);
  try {
    const res = await fetch(url, {
      headers: {
        "user-agent": USER_AGENT,
        accept,
        "accept-language": "tr-TR,tr;q=0.9,en;q=0.8",
        "cache-control": "no-cache",
      },
      redirect: "follow",
      signal: controller.signal,
    });

    const buffer = await res.arrayBuffer();
    const body = decodeBody(buffer, res.headers.get("content-type"));

    return { ok: res.ok, status: res.status, url: res.url || url, body };
  } catch (error) {
    return {
      ok: false,
      status: 0,
      url,
      body: "",
      error: error instanceof Error ? error.message : String(error),
    };
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Bazı Kıbrıs haber siteleri hâlâ ISO-8859-9 / windows-1254 kullanıyor.
 * Content-Type veya belge içindeki meta charset'e bakarak doğru çözücüyü seçiyoruz.
 */
function decodeBody(buffer: ArrayBuffer, contentType: string | null): string {
  const bytes = new Uint8Array(buffer);
  let charset = /charset=["']?([\w-]+)/i.exec(contentType ?? "")?.[1];

  if (!charset) {
    // İlk 2KB'yi latin1 varsayıp meta charset arıyoruz
    const head = new TextDecoder("latin1").decode(bytes.slice(0, 2048));
    charset =
      /<meta[^>]+charset=["']?([\w-]+)/i.exec(head)?.[1] ??
      /encoding=["']([\w-]+)["']/i.exec(head)?.[1];
  }

  const normalized = (charset ?? "utf-8").toLowerCase();
  try {
    return new TextDecoder(normalized).decode(bytes);
  } catch {
    return new TextDecoder("utf-8").decode(bytes);
  }
}

/** Bir URL'yi metin olarak indirir; geçici hatalarda tekrar dener. */
export async function fetchText(
  url: string,
  options: { timeout?: number; retries?: number; accept?: string } = {}
): Promise<FetchTextResult> {
  const { timeout = DEFAULT_TIMEOUT, retries = 2, accept = "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8" } = options;

  let last: FetchTextResult = { ok: false, status: 0, url, body: "", error: "başlatılmadı" };
  for (let attempt = 0; attempt <= retries; attempt++) {
    last = await once(url, timeout, accept);
    if (last.ok) return last;
    // 4xx (404/403 gibi) tekrar denemeye değmez
    if (last.status >= 400 && last.status < 500 && last.status !== 429) return last;
    if (attempt < retries) await sleep(800 * (attempt + 1));
  }
  return last;
}

/** İkili veri indirir (görseller için). */
export async function fetchBinary(
  url: string,
  timeout = DEFAULT_TIMEOUT
): Promise<{ ok: boolean; data?: Buffer; contentType?: string; error?: string }> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);
  try {
    const res = await fetch(url, {
      headers: { "user-agent": USER_AGENT, accept: "image/avif,image/webp,image/*,*/*;q=0.8" },
      redirect: "follow",
      signal: controller.signal,
    });
    if (!res.ok) return { ok: false, error: `HTTP ${res.status}` };

    const data = Buffer.from(await res.arrayBuffer());
    return { ok: true, data, contentType: res.headers.get("content-type") ?? undefined };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : String(error) };
  } finally {
    clearTimeout(timer);
  }
}
