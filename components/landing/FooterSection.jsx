export default function FooterSection() {
  return (
    <footer className="w-full bg-black text-white min-h-screen flex items-center snap-start">
      <div className="max-w-6xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
          <div>
            <h3 className="text-lg sm:text-xl font-bold">Nareswari Galeri</h3>
            <p className="text-xs sm:text-sm text-white/80 mt-2">Mewujudkan Momen Bersejarah Anda Menjadi Kenangan Abadi</p>
            <p className="text-xs sm:text-sm text-white/80 mt-3">Khas Make up dari Nareswari: <em>"Make up Soft tapi manglingi"</em></p>
          </div>

          <div>
            <h4 className="text-base sm:text-lg font-semibold mb-2">Layanan</h4>
            <ul className="list-disc pl-5 text-xs sm:text-sm text-white/80 mb-4">
              <li>Makeup Artist (MUA) & Hairstylist Profesional</li>
              <li>Sewa Kebaya, Gaun, & Busana</li>
              <li>Konsultan Gaya Pribadi</li>
              <li>Wedding Planner & Event Organizer</li>
              <li>Dekorasi Pernikahan & Acara</li>
              <li>Fotografi, Videografi, & Photobooth</li>
              <li>Aksesoris Pengantin & Pesta</li>
            </ul>

            <div className="text-xs sm:text-sm text-white/80">
              <div className="font-medium">Hubungi kami</div>
              <div className="mt-1 flex items-center gap-2">
                <i className="bi bi-whatsapp text-white text-lg" aria-hidden="true" />
                <span>WhatsApp: <a href="https://wa.me/6287727694239" className="text-white hover:underline">+62 8772-7694-239</a></span>
              </div>
              <div className="flex items-center gap-2">
                <i className="bi bi-envelope text-white text-lg" aria-hidden="true" />
                <span>Email: <a href="mailto:umikholifahsuhendra@gmail.com" className="text-white hover:underline">umikholifahsuhendra@gmail.com</a></span>
              </div>
              <div className="flex items-center gap-2">
                <i className="bi bi-geo-alt text-white text-lg" aria-hidden="true" />
                <span>Lokasi: <a href="https://goo.gl/maps/Yzjvk3Z3ckohpZbH6?g_st=awb" target="_blank" rel="noopener noreferrer" className="text-white hover:underline">Lihat di Google Maps</a></span>
              </div>

              <div className="mt-3">
                <div className="font-medium mb-2">Ikuti kami</div>
                <div className="flex items-center gap-3">
                  <a href="https://www.instagram.com/nareswari_galeri_indramayu?igsh=MWVkZjl3MzhpZ3drNg==" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-white hover:underline" aria-label="Instagram Nareswari Galeri">
                    <i className="bi bi-instagram text-lg" aria-hidden="true" />
                    <span className="text-xs sm:text-sm">Instagram</span>
                  </a>

                  <a href="https://www.facebook.com/share/1Zv5T1YeQz/" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-white hover:underline" aria-label="Facebook Nareswari Galeri">
                    <i className="bi bi-facebook text-lg" aria-hidden="true" />
                    <span className="text-xs sm:text-sm">Facebook</span>
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6 border-t border-white/10 pt-4 text-xs sm:text-sm text-white/60 text-center">
          © {new Date().getFullYear()} Nareswari Galeri. All rights reserved.
        </div>
      </div>
    </footer>
  )
}
