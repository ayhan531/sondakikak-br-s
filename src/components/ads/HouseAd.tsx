import { Mail, MessageCircle, Megaphone } from "lucide-react";
import { getSettings } from "@/lib/settings";

/**
 * Satılmamış reklam alanlarında boşluk yerine gösterilen "reklam ver" çağrısı.
 * E-posta ve WhatsApp numarası admin panelinden (Ayarlar > İletişim) yönetilir.
 */
export async function HouseAd({ className = "" }: { className?: string }) {
  const settings = await getSettings();
  const whatsappDigits = settings.adsWhatsapp.replace(/[^\d]/g, "");
  const waLink = whatsappDigits ? `https://wa.me/${whatsappDigits}` : null;

  return (
    <div
      className={`overflow-hidden rounded-lg bg-gradient-to-br from-brand-700 via-brand-800 to-brand-900 px-5 py-5 text-center shadow-sm ${className}`}
    >
      <div className="mb-1 text-center text-[10px] uppercase tracking-widest text-white/50">
        Reklam
      </div>
      <a
        href="/reklam"
        className="flex items-center justify-center gap-2 text-base font-black uppercase tracking-tight text-white transition hover:text-white/80 sm:text-xl"
      >
        <Megaphone className="h-5 w-5 shrink-0 sm:h-6 sm:w-6" />
        Buraya Reklam Verebilirsiniz
      </a>
      <div className="mt-3 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs font-bold text-white/90 sm:text-sm">
        <a
          href={`mailto:${settings.contactEmail}?subject=Reklam%20Talebi`}
          className="inline-flex items-center gap-1.5 transition hover:text-white"
        >
          <Mail className="h-4 w-4" />
          {settings.contactEmail}
        </a>
        {waLink && (
          <a
            href={waLink}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 transition hover:text-white"
          >
            <MessageCircle className="h-4 w-4" />
            {settings.adsWhatsapp}
          </a>
        )}
      </div>
    </div>
  );
}
