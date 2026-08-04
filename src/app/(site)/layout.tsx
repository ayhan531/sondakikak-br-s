import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { BreakingTicker } from "@/components/BreakingTicker";

/** Ziyaretçiye açık tüm sayfaların ortak çerçevesi. */
export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Header />
      <BreakingTicker />
      <main className="flex-1">{children}</main>
      <Footer />
    </>
  );
}
