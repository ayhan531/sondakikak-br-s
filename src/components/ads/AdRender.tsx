"use client";

import Image from "next/image";
import { useEffect, useRef } from "react";

export type AdData = {
  id: string;
  name: string;
  type: string;
  htmlCode: string | null;
  imageUrl: string | null;
  imageUrlMobile: string | null;
  linkUrl: string | null;
  altText: string | null;
};

/**
 * Reklamı ekrana getirir ve gerçekten görüntülendiğinde (viewport'a girdiğinde)
 * bir kez gösterim kaydı atar. Tıklamalar /r/[id] üzerinden sayılır.
 */
export function AdRender({ ad, className = "" }: { ad: AdData; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const counted = useRef(false);

  useEffect(() => {
    const element = ref.current;
    if (!element || counted.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting || counted.current) continue;
          counted.current = true;
          observer.disconnect();

          const url = `/api/reklam/${ad.id}/gosterim`;
          // sendBeacon başarısız olursa false döner; o durumda fetch'e düşüyoruz
          const sent = navigator.sendBeacon?.(url) ?? false;
          if (!sent) {
            fetch(url, { method: "POST", keepalive: true }).catch(() => {
              // Gösterim sayacı tutulamazsa ziyaretçiyi ilgilendirmez
            });
          }
        }
      },
      { threshold: 0.5 }
    );

    observer.observe(element);
    return () => observer.disconnect();
  }, [ad.id]);

  if (ad.type === "html" && ad.htmlCode) {
    return (
      <div ref={ref} className={className}>
        <div className="mb-1 text-center text-[10px] uppercase tracking-widest text-ink-400">
          Reklam
        </div>
        {/* Reklam kodu yalnızca yöneticinin admin panelinden girdiği koddur */}
        <div dangerouslySetInnerHTML={{ __html: ad.htmlCode }} />
      </div>
    );
  }

  if (!ad.imageUrl) return null;

  const image = (
    <>
      <Image
        src={ad.imageUrl}
        alt={ad.altText ?? ad.name}
        width={1200}
        height={300}
        className={`h-auto w-full rounded-lg ${ad.imageUrlMobile ? "hidden sm:block" : ""}`}
        unoptimized
      />
      {ad.imageUrlMobile && (
        <Image
          src={ad.imageUrlMobile}
          alt={ad.altText ?? ad.name}
          width={800}
          height={600}
          className="h-auto w-full rounded-lg sm:hidden"
          unoptimized
        />
      )}
    </>
  );

  return (
    <div ref={ref} className={className}>
      <div className="mb-1 text-center text-[10px] uppercase tracking-widest text-ink-400">
        Reklam
      </div>
      {ad.linkUrl ? (
        <a
          href={`/api/reklam/${ad.id}/tikla`}
          target="_blank"
          rel="noopener sponsored nofollow"
          className="block"
        >
          {image}
        </a>
      ) : (
        image
      )}
    </div>
  );
}
