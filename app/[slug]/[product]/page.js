import React from 'react'
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import DetailProduk from '@/components/client/DetailProduk'
import { canonicalCategorySlug, categoryMatchesSlug, slugify } from '@/lib/slug'

export default async function Page({ params }) {
  const resolvedParams = await params;
  const categoryParam = typeof resolvedParams?.slug === 'string' ? resolvedParams.slug : '';
  const productParam = typeof resolvedParams?.product === 'string' ? resolvedParams.product : '';
  if (!productParam) return <div>Produk tidak ditemukan</div>;

  try {
    const headersList = await headers();
    const host = headersList.get('host') || process.env.NEXT_PUBLIC_BASE_HOST || 'localhost:3000';
    const protocol = process.env.VERCEL ? 'https' : 'http';
    const base = process.env.NEXT_PUBLIC_BASE_URL && process.env.NEXT_PUBLIC_BASE_URL.startsWith('http')
      ? process.env.NEXT_PUBLIC_BASE_URL
      : `${protocol}://${host}`;
    const res = await fetch(`${base}/api/produk`, { cache: 'no-store' });
    const products = await res.json();
    if (!Array.isArray(products)) return <div>Produk tidak ditemukan</div>;

    const categorySlug = slugify(categoryParam);
    const prod = products.find(p => {
      if (!p?.nama_paket) return false;
      const productSlug = slugify(p.nama_paket);
      if (productSlug !== productParam) return false;
      if (!categorySlug) return true;
      return categoryMatchesSlug(p, categorySlug);
    });

    if (!prod) return <div>Produk tidak ditemukan</div>;

    const canonicalCategory = canonicalCategorySlug(prod);
    if (categorySlug && canonicalCategory && canonicalCategory !== categorySlug) {
      redirect(`/${canonicalCategory}/${productParam}`);
    }
    return (
      <div className="p-6">
        <DetailProduk product={prod} />
      </div>
    );
  } catch (e) {
    return <div>Gagal memuat produk</div>;
  }
}
