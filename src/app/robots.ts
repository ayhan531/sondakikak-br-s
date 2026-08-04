import type { MetadataRoute } from "next";
import { getSettings } from "@/lib/settings";

export default async function robots(): Promise<MetadataRoute.Robots> {
  const settings = await getSettings();
  const base = settings.siteUrl.replace(/\/$/, "");

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/admin", "/api/", "/arama"],
      },
      // Haber tarayıcılarına özel izin
      { userAgent: "Googlebot-News", allow: "/" },
      { userAgent: "Googlebot-Image", allow: "/" },
    ],
    sitemap: [`${base}/sitemap.xml`, `${base}/news-sitemap.xml`],
    host: base,
  };
}
