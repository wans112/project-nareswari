import { redirect } from "next/navigation";
import ListProduk from "../../components/client/ListProduk";
import { init } from "@/lib/db";
import { resolveCanonicalCategorySlug, slugify } from "@/lib/slug";

export default async function Page({ params }) {
  const resolvedParams = await params;
  const incoming = typeof resolvedParams?.slug === "string" ? resolvedParams.slug : "";
  const normalized = slugify(incoming);

  if (!normalized) {
    return <ListProduk category={""} />;
  }

  let canonical = normalized;
  try {
    const db = await init();
    const categories = db
      .prepare("SELECT nama_kategori, sub_kategori, code_kategori FROM kategori_produk")
      .all();
    const resolved = resolveCanonicalCategorySlug(incoming, categories);
    if (resolved) {
      canonical = resolved;
    }
  } catch (error) {
    console.error("Failed resolving category slug", error);
  }

  if (canonical !== normalized) {
    redirect(`/${canonical}`);
  }

  return <ListProduk category={canonical} />;
}
