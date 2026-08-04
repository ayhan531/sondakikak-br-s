# Son Dakika Kıbrıs

Kıbrıs ve KKTC gündemini takip eden, anlaşmalı kaynaklardan otomatik haber çeken,
SEO odaklı haber portalı.

- **Teknoloji:** Next.js 16 (App Router) · TypeScript · Tailwind CSS 4 · Prisma 7 + SQLite
- **Yönetim:** `/admin` altında tam kapsamlı panel
- **Otomasyon:** 10 haber kaynağından RSS/tarama ile 7/24 haber çekimi

---

## Hızlı Başlangıç

```bash
npm install
cp .env.example .env          # değerleri doldurun
npx prisma migrate dev        # veritabanını oluşturur
npm run db:seed               # yönetici, kategoriler, kaynaklar
npm run fetch:news            # ilk haberleri çeker (~2-3 dakika)
npm run dev
```

Site `http://localhost:3000`, panel `http://localhost:3000/admin` adresinde açılır.
Giriş bilgileri `.env` içindeki `ADMIN_EMAIL` / `ADMIN_PASSWORD` değerleridir.

---

## Ortam Değişkenleri

| Değişken | Açıklama |
|---|---|
| `DATABASE_URL` | SQLite dosya yolu. Render'da `file:/var/data/sondakika.db` |
| `DATA_DIR` | Veritabanı ve haber görsellerinin klasörü. Render'da `/var/data` |
| `NEXT_PUBLIC_SITE_URL` | Sitenin tam adresi. **SEO için doğru olmalı** (canonical, sitemap, OG) |
| `AUTH_SECRET` | Oturum imzalama anahtarı. `openssl rand -base64 48` ile üretin |
| `CRON_SECRET` | `/api/cron/haber-cek` uç noktasını koruyan anahtar |
| `ADMIN_EMAIL` / `ADMIN_PASSWORD` / `ADMIN_NAME` | İlk yönetici hesabı (yalnızca veritabanı boşken oluşturulur) |
| `FETCH_INTERVAL_MINUTES` | Uygulama içi zamanlayıcının çekim aralığı (en az 5, `0` = kapalı) |

---

## Haber Çekme Sistemi

### Kaynaklar

| Kaynak | Yöntem |
|---|---|
| Haber Kıbrıs | RSS + sayfa çıkarımı |
| Kıbrıs Postası | Kategori sayfası tarama (RSS'i yok) |
| Kıbrıs Gazetesi | RSS |
| Yenidüzen | RSS + sayfa çıkarımı |
| Özgür Gazete Kıbrıs | RSS |
| Gündem Kıbrıs | RSS (tam içerik) |
| Bağımsız | RSS (tam içerik) |
| Bugün Kıbrıs | RSS (tam içerik) |
| Diyalog Gazetesi | RSS (tam içerik) |
| Kıbrıs Gerçek | RSS (tam içerik) |

### İşleyiş

1. **Toplama** — RSS beslemesi okunur; RSS yoksa kategori sayfalarından haber
   bağlantıları toplanır (`Source.linkPattern` deseniyle).
2. **Tekilleştirme** — Daha önce çekilen adresler atlanır. Ayrıca son 3 günün
   başlıklarıyla kelime benzerliği karşılaştırılır; aynı ajans haberi birden fazla
   kaynaktan tekrar yayınlanmaz.
3. **İçerik çıkarımı** — Besleme tam metni içermiyorsa haber sayfası indirilir;
   JSON-LD `articleBody` → Mozilla Readability → seçici tabanlı yöntem sırasıyla denenir.
4. **Temizleme** (`src/lib/scraper/clean.ts`) — Kaynak sitenin reklam banner'ları,
   paylaş düğmeleri, "Haberi dinle" gibi arayüz metinleri ve tanıtım cümleleri atılır.
   Etiketler beyaz listeye indirgenir, `on*` öznitelikleri ve `javascript:` adresleri
   temizlenir, iframe'ler yalnızca YouTube/Vimeo için bırakılır.
5. **Zenginleştirme** — Kategori eşleştirme, özet, okuma süresi, SEO meta alanları ve
   özel isimlerden etiket üretimi.
6. **Görsel** — Kaynak görsel indirilir, WebP'ye çevrilir, en fazla 1280px'e küçültülür
   ve `DATA_DIR/uploads` altına kaydedilir. Böylece kaynak siteye bağımlı kalmayız.

### Çalıştırma yolları

```bash
npm run fetch:news              # tüm aktif kaynaklar
npm run fetch:news -- bagimsiz  # tek kaynak
npm run reclean                 # temizleme kuralları değişince mevcut haberleri yenile
```

- **Uygulama içi zamanlayıcı:** `FETCH_INTERVAL_MINUTES` ayarlıysa sunucu kendi
  içinde düzenli olarak çeker (`src/instrumentation.ts`).
- **Dışarıdan cron:** `GET /api/cron/haber-cek` — `Authorization: Bearer $CRON_SECRET`
  başlığı gerekir. Tek kaynak için `?kaynak=bagimsiz` eklenebilir.
- **Panelden elle:** Haber Kaynakları sayfasındaki "Şimdi Çek" düğmeleri.

---

## SEO

- Her habere ayrı sayfa: `/haber/<slug>` — Türkçe karakterler ASCII'ye indirgenir
- Habere özel `<title>`, meta açıklama, canonical, OpenGraph ve Twitter kartları
- **JSON-LD**: `NewsArticle` + `BreadcrumbList` yapısal verisi
- **Site haritaları**: `/sitemap.xml` (dizin) → sayfalar, kategoriler, etiketler ve
  5.000'lik parçalar hâlinde haberler
- **Google News site haritası**: `/news-sitemap.xml` — son 48 saatin haberleri
- `/robots.txt` (Googlebot-News izinli, `/admin` ve `/arama` kapalı), `/rss.xml`
- Sunucu tarafında render, `next/image` ile AVIF/WebP, kalıcı görsel önbelleği

Yayına aldıktan sonra: Google Search Console'a `sitemap.xml` ve `news-sitemap.xml`
adreslerini ekleyin, ardından Google Publisher Center'a başvurun.

---

## Yönetim Paneli

| Sayfa | İçerik |
|---|---|
| Genel Bakış | Haber/okunma/reklam sayaçları, kaynak durumu, çekim geçmişi |
| Haberler | Arama ve filtreli liste, hızlı manşet/son dakika işaretleme, düzenleme, silme |
| Haber Formu | Başlık, slug, özet, HTML gövde (biçimlendirme araçlı), görsel yükleme, SEO alanları |
| Kategoriler | Ekleme/düzenleme, renk, menü sırası, kategori SEO'su |
| Haber Kaynakları | Kaynak ekleme, RSS/tarama modu, çekim limiti, elle çekim, hata takibi |
| Reklamlar | 10 konum, görsel veya HTML (AdSense) reklam, tarih aralığı, gösterim/tıklama istatistiği |
| İstatistikler | Günlük okunma grafiği, en çok okunanlar, kategori/cihaz dağılımı, ziyaretçi kaynakları |
| Ayarlar | Site bilgileri, iletişim, sosyal medya, analitik kodları, şifre değiştirme |

### Reklam konumları

`header`, `under-header`, `sidebar-top`, `sidebar-mid`, `sidebar-bottom`,
`in-feed`, `article-top`, `article-mid`, `article-bottom`, `footer`

Gösterimler reklam ekranda gerçekten göründüğünde, tıklamalar `/api/reklam/[id]/tikla`
yönlendirmesi üzerinden sayılır.

---

## Render'a Dağıtım

Depoyu GitHub'a gönderin, Render'da **New → Blueprint** ile `render.yaml` dosyasını seçin.

Dikkat edilecekler:

1. **Kalıcı disk şart.** Veritabanı ve görseller `/var/data` altında durur; disk
   olmadan her deploy'da veriler silinir. Disk ücretli planlarda kullanılabilir.
2. **Migration'lar başlangıçta çalışır.** Disk build sırasında bağlı olmadığı için
   `npm start` komutu önce `prisma migrate deploy` çalıştırır.
3. **İlk kurulum otomatiktir.** Sunucu ilk açılışta yönetici hesabını, kategorileri ve
   10 kaynağı oluşturur (`src/lib/bootstrap.ts`). `ADMIN_PASSWORD` değerini Render
   panelinden girin, dosyaya yazmayın.
4. Alan adını bağladıktan sonra `NEXT_PUBLIC_SITE_URL` değerini güncelleyin —
   canonical adresler ve site haritaları bu değeri kullanır.

### PostgreSQL'e geçiş

`prisma/schema.prisma` içindeki `provider` değerini `postgresql` yapın, `DATABASE_URL`
değerini Render Postgres bağlantısıyla değiştirin, `@prisma/adapter-better-sqlite3`
yerine `@prisma/adapter-pg` kullanın, `prisma/migrations` klasörünü silip
`npx prisma migrate dev --name init` ile yeniden üretin. Görseller için disk yine gerekir.

---

## Proje Yapısı

```
src/
  app/
    (site)/           ziyaretçiye açık sayfalar (ana sayfa, haber, kategori, arama…)
    admin/            yönetim paneli — giris/ ve (panel)/
    api/              cron, görüntülenme ve reklam uç noktaları
    sitemap.xml/ news-sitemap.xml/ rss.xml/ robots.ts/ manifest.ts
  components/         arayüz bileşenleri (kart, header, reklam, paylaşım…)
  lib/
    scraper/          haber çekme motoru (http, feed, extract, clean, image)
    prisma.ts queries.ts settings.ts auth.ts text.ts categories.ts storage.ts
  instrumentation.ts  açılışta ilk kurulum + zamanlayıcı
prisma/               şema, migration'lar, seed
scripts/              çekim, yeniden temizleme, etiket yenileme, görsel üretimi
```

---

## Yasal Not

Haberler, içerik paylaşımı konusunda anlaşma sağlanmış Kıbrıs merkezli haber
kuruluşlarından derlenmektedir. Yeni bir kaynak eklemeden önce o kuruluşla yazılı
izniniz olduğundan emin olun; kullanım şartları ve `robots.txt` kuralları kaynaktan
kaynağa değişebilir. Çekim motoru istekler arasında bekleme uygulayarak kaynak
sunucuları yormayacak şekilde davranır.
