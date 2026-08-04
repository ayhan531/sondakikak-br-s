import type { NextConfig } from "next";
import path from "node:path";

const nextConfig: NextConfig = {
  // Üst klasörlerdeki lockfile'lar yüzünden yanlış kök seçilmesin
  turbopack: { root: path.resolve(".") },

  images: {
    // Kendi kopyasını alamadığımız haber görselleri kaynak sitede kalır
    remotePatterns: [{ protocol: "https", hostname: "**" }],
    formats: ["image/avif", "image/webp"],
    minimumCacheTTL: 60 * 60 * 24 * 30,
  },

  // better-sqlite3 ve sharp yerel modüller; sunucu tarafında dışarıda bırakılmalı
  serverExternalPackages: ["better-sqlite3", "sharp", "@mozilla/readability", "jsdom"],

  poweredByHeader: false,
  compress: true,

  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
        ],
      },
    ];
  },
};

export default nextConfig;
