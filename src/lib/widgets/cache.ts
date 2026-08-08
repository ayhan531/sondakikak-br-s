/**
 * Widget verileri için süreli bellek önbelleği.
 * Kaynak erişilemezse süresi dolmuş eski değer döndürülür (bayat > hiç).
 */

type Entry = { value: unknown; expires: number };

const store = new Map<string, Entry>();

export async function cached<T>(
  key: string,
  ttlMs: number,
  loader: () => Promise<T | null>
): Promise<T | null> {
  const hit = store.get(key);
  if (hit && hit.expires > Date.now()) return hit.value as T;

  try {
    const value = await loader();
    if (value !== null && value !== undefined) {
      store.set(key, { value, expires: Date.now() + ttlMs });
      return value;
    }
  } catch {
    // aşağıda bayat değere düşülür
  }

  return hit ? (hit.value as T) : null;
}
