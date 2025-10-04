import { Button } from "../ui/button";

export default function AboutSection() {
  return (
  <section id="about" className="w-full min-h-screen text-black bg-white flex items-center snap-start">
      <div className="max-w-6xl mx-auto px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-stretch">
          <div className="rounded-md overflow-hidden shadow-md h-full">
            <div
              role="img"
              aria-label="Nareswari event"
              className="w-full h-full bg-cover bg-center"
              style={{ backgroundImage: "url('/about.jpg')" }}
            />
          </div>
          <div>
              <h2 className="text-3xl sm:text-4xl font-extrabold mb-6">Tentang Kami: Cerita di Balik Momen Sempurna Anda</h2>

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

              <p className="text-sm text-muted-foreground mb-4">Di Nareswari Galeri, Anda bukan sekadar klien, melainkan inspirasi. Mari kita wujudkan sebuah perayaan yang tak hanya indah di mata, tetapi juga hangat di hati.</p>

            <div className="flex gap-3">
              <Button asChild className="hover:shadow-2xl hover:scale-105 transition-transform duration-300 ease-in-out">
                <a href="#packages">Lihat Layanan</a>
              </Button>
              <Button asChild variant="outline" className="hover:shadow-2xl hover:scale-105 transition-transform duration-300 ease-in-out">
                <a href="#contact">Konsultasi</a>
              </Button>
            </div>

          </div>
        </div>
      </div>
    </section>
  )
}
