const MONTHS = [
  "Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran",
  "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık",
];

const DAYS = ["Pazar", "Pazartesi", "Salı", "Çarşamba", "Perşembe", "Cuma", "Cumartesi"];

function pad(value: number): string {
  return String(value).padStart(2, "0");
}

/** "2 Ağustos 2026, 14:35" */
export function formatDateTime(date: Date): string {
  return `${date.getDate()} ${MONTHS[date.getMonth()]} ${date.getFullYear()}, ${pad(
    date.getHours()
  )}:${pad(date.getMinutes())}`;
}

/** "2 Ağustos 2026" */
export function formatDate(date: Date): string {
  return `${date.getDate()} ${MONTHS[date.getMonth()]} ${date.getFullYear()}`;
}

/** "2 Ağustos 2026 Pazar" */
export function formatLongDate(date: Date): string {
  return `${date.getDate()} ${MONTHS[date.getMonth()]} ${date.getFullYear()} ${DAYS[date.getDay()]}`;
}

/** "14:35" */
export function formatTime(date: Date): string {
  return `${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

/**
 * Haber listelerinde kullanılan göreli zaman.
 * 1 günden eskiyse tam tarihe döner ki okuyucu yanılmasın.
 */
export function timeAgo(date: Date, now: Date = new Date()): string {
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (seconds < 0) return formatDateTime(date);
  if (seconds < 60) return "az önce";
  if (seconds < 3600) return `${Math.floor(seconds / 60)} dakika önce`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)} saat önce`;
  if (seconds < 172800) return "dün";
  return formatDate(date);
}

/** 12500 -> "12,5 B" */
export function formatCount(value: number): string {
  if (value < 1000) return String(value);
  if (value < 1_000_000) {
    const thousands = value / 1000;
    return `${thousands.toFixed(thousands < 10 ? 1 : 0).replace(".", ",")} B`;
  }
  return `${(value / 1_000_000).toFixed(1).replace(".", ",")} M`;
}
