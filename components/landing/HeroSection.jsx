"use client";
import { Button } from "../ui/button";

export default function HeroSection() {
  return (
  <section id="hero" className="w-full min-h-screen relative flex items-center snap-start">
      {/* Background covers the entire section and will crop automatically (bg-cover) */}
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: "url('/hero.jpg')" }}
        aria-hidden="true"
      />
      <div className="absolute inset-0 bg-black/70" aria-hidden="true" />

      <div className="relative z-10 max-w-6xl mx-auto px-6 py-16 sm:py-24 w-full">
        <div className="text-center py-12 sm:py-16">
          <h1 
            className="text-3xl sm:text-5xl text-white mb-4 sm:mb-6"
            style={{ 
              fontWeight: 'bold' 
            }}
          >
            Wujudkan Momen Sempurna Anda Bersama Nareswari Galeri
          </h1>

          <p className="text-gray-100 text-sm sm:text-lg mb-4 sm:mb-6 mx-auto max-w-2xl">
            Sejak 2015, kami mendedikasikan diri untuk merangkai setiap detail hari istimewa Anda, mulai dari riasan memukau, busana menawan, hingga dekorasi impian.
          </p>

          <div className="flex gap-3 justify-center">
            <Button asChild variant="outline" size="lg" className="text-black hover:shadow-2xl hover:scale-105 transition-transform duration-300 ease-in-out">
              <a href="#packages">Lihat Layanan</a>
            </Button>
            <Button asChild size="lg" className="bg-transparent border hover:shadow-2xl hover:scale-105 transition-transform duration-300 ease-in-out">
              <a href="#contact">Hubungi Kami</a>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
