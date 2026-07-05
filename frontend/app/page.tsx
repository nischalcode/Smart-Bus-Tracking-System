import Feature from "@/component/features/Feature";
import Footer from "@/component/footer/Footer";
import Header from "@/component/head/Header";
import HeroSection from "@/component/hero/HeroSection";
import LiveTracking from "@/component/LiveTracking/LiveTracking";
import WhyChoose from "@/component/Need/Need";
import Stats from "@/component/stats/Stats";


export default function Home() {
  return (
    <div>
     <Header/>
     <HeroSection/>
     <Feature/>
     <LiveTracking/>
     <Stats/>
     <WhyChoose/>
     <Footer/>
    </div>
  );
}
