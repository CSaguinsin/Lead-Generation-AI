import HeroSection from "@/app/components/UI/herosection";
import Navbar from "./components/UI/navbar";
import Features from "@/app/components/UI/features";
import Footer from "@/app/components/UI/footer";


export default function Home() {
  return (
    <>
    <Navbar />
    <HeroSection />
    <Features />
    <Footer />
    </>
  );
}
