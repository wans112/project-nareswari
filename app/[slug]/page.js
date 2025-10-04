import React from 'react'
import { headers } from 'next/headers'
import DetailProduk from '@/components/produk/DetailProduk'

function slugify(text = '') {
  return String(text)
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

export default async function Page({ params }) {
  const { slug } = params || {};
  // fetch product list and match by slugified nama_paket
  try {
    const h = headers();
    const host = h.get('host');
    const protocol = process.env.VERCEL ? 'https' : 'http';
    const base = process.env.NEXT_PUBLIC_BASE_URL && process.env.NEXT_PUBLIC_BASE_URL.startsWith('http')
      ? process.env.NEXT_PUBLIC_BASE_URL
      : `${protocol}://${host}`;
    const res = await fetch(`${base}/api/produk`, { cache: 'no-store' });
    const products = await res.json();
    if (!Array.isArray(products)) return <div>Produk tidak ditemukan</div>;
    const prod = products.find(p => p?.nama_paket && slugify(p.nama_paket) === String(slug));
    if (!prod) return <div>Produk tidak ditemukan</div>;
    return (
      <div className="p-6">
        <DetailProduk product={prod} />
      </div>
    );
  } catch (e) {
    return <div>Gagal memuat produk</div>;
  }
}
