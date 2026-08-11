import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { BreakingTicker } from "@/components/BreakingTicker";
import { PushPrompt } from "@/components/PushPrompt";
import { InfoBar } from "@/components/widgets/InfoBar";
import { SiteJsonLd } from "@/components/SiteJsonLd";

/** Ziyaretçiye açık tüm sayfaların ortak çerçevesi. */
export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Header />
      <InfoBar />
      <BreakingTicker />
      <main className="flex-1">{children}</main>
      <Footer />
      <PushPrompt />
      <SiteJsonLd />
    </>
  );
}
