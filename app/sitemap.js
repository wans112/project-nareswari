import { MetadataRoute } from 'next';
import { init } from '@/lib/db';

function getBaseUrl() {
  const envUrl = process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_BASE_URL;
  if (!envUrl) {
    return 'https://www.nareswarigaleri.com';
  }
  return envUrl.replace(/\/$/, '');
}

function slugify(text = '') {
  return String(text)
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

export default async function sitemap() {
  const baseUrl = getBaseUrl();
  const now = new Date();

  const entries = [
    {
      url: `${baseUrl}/`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 1,
    },
    {
      url: `${baseUrl}/order`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.7,
    },
  ];

  try {
    const db = await init();

    const products = db.prepare(`
      SELECT p.id, p.nama_paket, p.created_at, kp.nama_kategori, kp.sub_kategori
      FROM produk p
      JOIN kategori_produk kp ON kp.id = p.kategori_produk_id
    `).all();

    const categoryMap = new Map();

    for (const product of products) {
      const catSlug = slugify(product.nama_kategori || '');
      if (catSlug) {
        categoryMap.set(catSlug, product.created_at || now.toISOString());
      }
      const subSlug = slugify(product.sub_kategori || '');
      if (subSlug) {
        categoryMap.set(subSlug, product.created_at || now.toISOString());
      }

      const productSlug = slugify(product.nama_paket || '');
      const parentSlug = subSlug || catSlug;
      if (!productSlug || !parentSlug) continue;

      entries.push({
        url: `${baseUrl}/${parentSlug}/${productSlug}`,
        lastModified: product.created_at ? new Date(product.created_at) : now,
        changeFrequency: 'monthly',
        priority: 0.6,
      });
    }

    for (const [slug, createdAt] of categoryMap.entries()) {
      entries.push({
        url: `${baseUrl}/${slug}`,
        lastModified: createdAt ? new Date(createdAt) : now,
        changeFrequency: 'weekly',
        priority: 0.8,
      });
    }
  } catch (error) {
    console.error('Failed generating sitemap entries:', error);
  }

  return entries;
}
