"use client";

import { AnimatedInView } from "@/components/ui/animated-in-view";
import { Button } from "../ui/button";

export default function AboutSection() {
  return (
  <section id="about" className="w-full min-h-screen text-black bg-white flex items-center snap-start">
      <div className="max-w-6xl mx-auto px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-stretch">
          <AnimatedInView className="rounded-md overflow-hidden shadow-md h-full" threshold={0.25}>
            <div
              role="img"
              aria-label="Nareswari event"
              className="w-full h-full bg-cover bg-center"
              style={{ backgroundImage: "url('/about.jpg')" }}
            />
          </AnimatedInView>
          <AnimatedInView threshold={0.25}>
            {/* Desktop: show original (long) content on md+ screens */}
            <div className="hidden md:block">
              <h2 className="text-3xl sm:text-4xl !font-extrabold mb-6">Tentang Kami: Cerita di Balik Momen Sempurna Anda</h2>

                  <p className="text-sm sm:text-lg text-muted-foreground mb-4">
                    Sejak 2015, Nareswari Galeri lahir dari sebuah mimpi: menjadi bagian dari cerita bahagia Anda. Kami menyadari bahwa persiapan sebuah acara istimewa membutuhkan lebih dari sekadar penampilan yang menawan, tetapi juga kemudahan dan ketenangan pikiran. Karena itulah, kami bertransformasi menjadi solusi terpadu untuk Anda.
                  </p>

              <p className="text-sm text-muted-foreground mb-4">
                Dari sebuah visi, kini kami hadir untuk menyediakan semua kebutuhan Anda dalam satu atap. Setiap layanan kami rancang dengan penuh cinta dan perhatian, mencakup:
              </p>

              <div className="space-y-3 text-sm text-muted-foreground mb-4">
                <div>
                  <strong>Penampilan & Gaya:</strong> Jasa MUA profesional, tata rambut, konsultasi kebaya, serta sewa busana pria & wanita beserta aksesorisnya.
                </div>
                <div>
                  <strong>Perencanaan & Dekorasi:</strong> Layanan Wedding Planner, Event Organizer, dan penataan dekorasi yang magis.
                </div>
                <div>
                  <strong>Dokumentasi Abadi:</strong> Paket fotografi, videografi, foto prewedding, dan photobooth untuk mengabadikan kenangan.
                </div>
              </div>

              <div className="flex gap-3">
                <Button asChild className="hover:shadow-2xl hover:scale-105 transition-transform duration-300 ease-in-out">
                  <a href="#packages">Lihat Layanan</a>
                </Button>
                <Button asChild variant="outline" className="hover:shadow-2xl hover:scale-105 transition-transform duration-300 ease-in-out">
                  <a href="https://wa.me/6287727694239?text=Saya ingin berkonsultasi" target="_blank" rel="noopener noreferrer">Konsultasi</a>
                </Button>
              </div>
            </div>

            {/* Mobile: show concise content on small screens */}
            <div className="block md:hidden">
              <h2 className="text-3xl sm:text-4xl !font-extrabold mb-6">Tentang Kami: Cerita di Balik Momen Sempurna Anda</h2>

              <p className="text-sm sm:text-lg text-muted-foreground mb-4">
                Sejak 2015 kami membantu mewujudkan acara istimewa Anda dengan solusi one-stop: rias, busana, dan dekorasi — dirancang dengan perhatian pada detail dan kemudahan pelanggan.
              </p>

              <div className="space-y-3 text-sm text-muted-foreground mb-4">
                <div>
                  <strong>Layanan Utama:</strong> Jasa MUA & sewa busana, serta paket perencanaan & dekorasi.
                </div>
                <div>
                  <strong>Dokumentasi:</strong> Fotografi & videografi profesional untuk mengabadikan momen Anda.
                </div>
              </div>

              <div className="flex gap-3">
                <Button asChild className="hover:shadow-2xl hover:scale-105 transition-transform duration-300 ease-in-out">
                  <a href="#packages">Lihat Layanan</a>
                </Button>
                <Button asChild variant="outline" className="hover:shadow-2xl hover:scale-105 transition-transform duration-300 ease-in-out">
                  <a href="https://wa.me/6287727694239?text=Saya ingin berkonsultasi" target="_blank" rel="noopener noreferrer">Konsultasi</a>
                </Button>
              </div>
            </div>
          </AnimatedInView>
        </div>
      </div>
    </section>
  )
}
