import Nav from "../components/Nav";
import Hero from "../components/Hero";
import Marquee from "../components/Marquee";
import Stats from "../components/Stats";
import Disciplines from "../components/Disciplines";
import Coaches from "../components/Coaches";
import Schedule from "../components/Schedule";
import Pricing from "../components/Pricing";
import Gallery from "../components/Gallery";
import Contact from "../components/Contact";
import Footer from "../components/Footer";

export default function SiteVitrine() {
  return (
    <div className="relative min-h-screen bg-ink">
      <div className="noise-overlay" />
      <Nav />
      <main>
        <Hero />
        <Marquee />
        <Stats />
        <Disciplines />
        <Coaches />
        <Schedule />
        <Pricing />
        <Gallery />
        <Contact />
      </main>
      <Footer />
    </div>
  );
}
