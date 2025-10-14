import NavbarFloat from "../components/ui/NavbarFloat";
import HeroSection from "../components/landing/HeroSection";
import CategoriesSection from "@/components/landing/CategoriesSection";
import ReviewSection from "@/components/landing/ReviewSection";
import FooterSection from "@/components/landing/FooterSection";
import AboutSection from "@/components/landing/AboutSection";
import DiskonSection from "@/components/landing/DiskonSection";
import { init } from "@/lib/db";

function slugify(text = "") {
  return String(text)
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

async function loadCategories(db) {
  const rows = db
    .prepare(
      `SELECT id, nama_kategori, sub_kategori, code_kategori, deskripsi_kategori
       FROM kategori_produk
       ORDER BY nama_kategori, sub_kategori`
    )
    .all();

  const categoryMap = new Map();

  rows.forEach((row) => {
    const nama = row.nama_kategori || "";
    if (!nama) return;

    const groupSlug = slugify(nama);

    if (!categoryMap.has(groupSlug)) {
      categoryMap.set(groupSlug, {
        id: row.id, // Use the first ID encountered for this group
        label: nama,
        description: row.deskripsi_kategori,
        href: `/${groupSlug}`,
        slug: groupSlug,
        groupSlug: groupSlug,
        groupLabel: nama,
      });
    }
  });

  return Array.from(categoryMap.values());
}

async function loadDiscounts(db) {
  const rows = db
    .prepare(
      `SELECT d.id, d.nama_diskon, d.deskripsi, d.persentase, d.nominal, d.mulai, d.berakhir,
              p.id AS produk_id, p.nama_paket, p.harga,
              kp.nama_kategori, kp.sub_kategori
       FROM diskon d
       LEFT JOIN produk p ON p.id = d.produk_id
       LEFT JOIN kategori_produk kp ON kp.id = p.kategori_produk_id
       WHERE d.aktif = 1
         AND (d.mulai IS NULL OR datetime('now') >= datetime(d.mulai))
         AND (d.berakhir IS NULL OR datetime('now') <= datetime(d.berakhir))
       ORDER BY COALESCE(d.mulai, d.created_at) DESC
       LIMIT 4`
    )
    .all();

  return rows.map((row) => {
    const kategoriNama = row.nama_kategori || "";
    const kategoriLabel = row.sub_kategori ? `${kategoriNama} — ${row.sub_kategori}` : (kategoriNama || "Produk");
    const categorySlug = slugify(kategoriNama);
    const productSlug = slugify(row.nama_paket || row.nama_diskon || "");
    const href = categorySlug && productSlug ? `/${categorySlug}/${productSlug}` : null;

    return {
      id: row.id,
      nama_diskon: row.nama_diskon || "Promo Spesial",
      deskripsi: row.deskripsi,
      persentase: row.persentase,
      nominal: row.nominal,
      mulai: row.mulai,
      berakhir: row.berakhir,
      produk_nama: row.nama_paket || "Paket Penawaran",
      kategori_label: kategoriLabel,
      href,
    };
  });
}

export default async function Home() {
  let categories = [];
  let discounts = [];

  try {
    const db = await init();
    categories = await loadCategories(db);
    discounts = await loadDiscounts(db);
  } catch (err) {
    console.error("Gagal memuat data kategori atau diskon:", err);
  }

  const categoryCards = categories.map(({ id, label, description, href }) => ({ id, label, description, href }));

  const layananMap = new Map();
  categories.forEach((item) => {
    if (!item.groupSlug) return;
    if (!layananMap.has(item.groupSlug)) {
      layananMap.set(item.groupSlug, {
        href: `/${item.groupSlug}`,
        label: item.groupLabel,
      });
    }
  });
  const layananSublinks = Array.from(layananMap.values());

  const links = [{ href: "#hero", label: "Home" }];
  if (discounts.length) {
    links.push({ href: "#diskon", label: "Diskon" });
  }
  if (layananSublinks.length) {
    links.push({ label: "Layanan", sublink: layananSublinks });
  } else {
    links.push({ href: "#packages", label: "Layanan" });
  }
  links.push({ href: "#reviews", label: "Ulasan" });
  links.push({ href: "#about", label: "Tentang Kami" });

  const cta = { href: "#contact", label: "Hubungi" };

  return (
    <main className="h-screen overflow-y-auto snap-y snap-mandatory scroll-smooth bg-black text-white flex flex-col items-center">
      <NavbarFloat brand="Nareswari Galeri" links={links} cta={cta} />
      <HeroSection />
      {discounts.length ? <DiskonSection items={discounts} /> : null}
      <CategoriesSection initialCategories={categoryCards} />
      <ReviewSection />
      <AboutSection />
      <FooterSection />
    </main>
  );
}
