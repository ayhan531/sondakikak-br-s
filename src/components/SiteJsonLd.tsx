import { getSettings } from "@/lib/settings";

/**
 * Site geneli yapılandırılmış veri: WebSite (arama kutusuyla) + NewsMediaOrganization.
 * Google'ın marka panelini ve site içi arama kutusunu (sitelinks searchbox)
 * doğru göstermesini sağlar.
 */
export async function SiteJsonLd() {
  const settings = await getSettings();
  const base = settings.siteUrl.replace(/\/$/, "");

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebSite",
        "@id": `${base}/#website`,
        url: `${base}/`,
        name: settings.siteName,
        description: settings.siteDescription,
        inLanguage: "tr-TR",
        publisher: { "@id": `${base}/#organization` },
        potentialAction: {
          "@type": "SearchAction",
          target: {
            "@type": "EntryPoint",
            urlTemplate: `${base}/arama?q={search_term_string}`,
          },
          "query-input": "required name=search_term_string",
        },
      },
      {
        "@type": "NewsMediaOrganization",
        "@id": `${base}/#organization`,
        name: settings.siteName,
        url: `${base}/`,
        logo: {
          "@type": "ImageObject",
          url: `${base}/logo.png`,
          width: 512,
          height: 512,
        },
        sameAs: [
          settings.facebookUrl,
          settings.twitterUrl,
          settings.instagramUrl,
          settings.youtubeUrl,
        ].filter(Boolean),
      },
    ],
  };

  return (
    <script
      type="application/ld+json"
      suppressHydrationWarning
      // "<" kaçırılır ki ayar metinleri script etiketinden kaçamasın (XSS önlemi)
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }}
    />
  );
}
