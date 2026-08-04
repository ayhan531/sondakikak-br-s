import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import { getSettings } from "@/lib/settings";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin", "latin-ext"], // latin-ext: Türkçe karakterler için şart
  display: "swap",
});

export const viewport: Viewport = {
  themeColor: "#dc2626",
  width: "device-width",
  initialScale: 1,
};

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSettings();

  return {
    metadataBase: new URL(settings.siteUrl),
    title: {
      default: `${settings.siteName} — ${settings.siteTagline}`,
      template: `%s | ${settings.siteName}`,
    },
    description: settings.siteDescription,
    keywords: settings.siteKeywords.split(",").map((word) => word.trim()),
    applicationName: settings.siteName,
    referrer: "origin-when-cross-origin",
    alternates: {
      canonical: "/",
      types: { "application/rss+xml": `${settings.siteUrl}/rss.xml` },
    },
    openGraph: {
      type: "website",
      locale: "tr_TR",
      siteName: settings.siteName,
      title: `${settings.siteName} — ${settings.siteTagline}`,
      description: settings.siteDescription,
      url: settings.siteUrl,
    },
    twitter: {
      card: "summary_large_image",
      title: settings.siteName,
      description: settings.siteDescription,
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        "max-image-preview": "large",
        "max-snippet": -1,
        "max-video-preview": -1,
      },
    },
    verification: settings.googleSearchConsole
      ? { google: settings.googleSearchConsole }
      : undefined,
  };
}

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const settings = await getSettings();

  return (
    <html lang="tr" className={`${inter.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col">
        {children}

        {settings.googleAnalyticsId && (
          <>
            <Script
              src={`https://www.googletagmanager.com/gtag/js?id=${settings.googleAnalyticsId}`}
              strategy="afterInteractive"
            />
            <Script id="ga-init" strategy="afterInteractive">
              {`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','${settings.googleAnalyticsId}');`}
            </Script>
          </>
        )}

        {settings.googleAdsenseId && (
          <Script
            async
            src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${settings.googleAdsenseId}`}
            crossOrigin="anonymous"
            strategy="afterInteractive"
          />
        )}
      </body>
    </html>
  );
}
