import NavbarFloat from "../components/ui/NavbarFloat";
import HeroSection from "../components/landing/HeroSection";
import CategoriesSection from "@/components/landing/CategoriesSection";
import ReviewSection from "@/components/landing/ReviewSection";
import FooterSection from "@/components/landing/FooterSection";
import AboutSection from "@/components/landing/AboutSection";

export default function Home() {
  const links = [
    { href: "#hero", label: "Home" },
    {
      label: "Layanan",
      sublink: [
        { href: "/pernikahan", label: "Pernikahan" },
        { href: "/dekorasi", label: "Dekorasi & Akad" },
        { href: "/prewedding", label: "Prewedding" },
        { href: "/khitan", label: "Khitan/Rasulan" },
      ],
    },
    { href: "#reviews", label: "Ulasan" },
    { href: "#about", label: "Tentang Kami" },
  ];

  const cta = { href: "#contact", label: "Hubungi" };

  return (
    <main className="h-screen overflow-y-auto snap-y snap-mandatory scroll-smooth bg-black text-white flex flex-col items-center">
      <NavbarFloat brand="Nareswari Galeri" links={links} cta={cta} />
      <HeroSection />
      <CategoriesSection />
      <ReviewSection />
      <AboutSection />
      <FooterSection />
    </main>
  );
}
