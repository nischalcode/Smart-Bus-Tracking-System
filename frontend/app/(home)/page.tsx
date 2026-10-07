import Footer from "@/component/footer/Footer";
import Header from "@/component/head/Header";
import HeroSection from "@/component/hero/HeroSection";
import PublicOverview from "@/component/features/PublicOverview";

export default function Home() {
  return (
    <div className="min-h-screen overflow-x-hidden">
      <Header />
      <HeroSection />
      <PublicOverview />
      <Footer />
    </div>
  );
}
