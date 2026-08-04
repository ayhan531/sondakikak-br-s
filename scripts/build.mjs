// Production build sarmalayıcısı.
//
// `next build` statik sayfaları önceden render ederken veritabanına bağlanır.
// Render'da build sırasında kalıcı disk (/var/data) bağlı olmadığı için
// gerçek veritabanına ulaşılamaz. Bu yüzden build'e özel geçici bir SQLite
// dosyası oluşturup migration'ları ona uyguluyoruz; sayfalar boş ama geçerli
// bir şemayla render edilir ve çalışma anında (ISR) gerçek veriyle yenilenir.
import { execSync } from "node:child_process";
import { mkdirSync } from "node:fs";

const dbDir = ".build-db";
mkdirSync(dbDir, { recursive: true });

const env = { ...process.env, DATABASE_URL: `file:./${dbDir}/build.db` };
const run = (cmd) => execSync(cmd, { stdio: "inherit", env });

run("npx prisma migrate deploy");
run("npx next build");
