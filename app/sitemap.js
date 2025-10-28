import { MetadataRoute } from 'next';
import { init } from '@/lib/db';
import { canonicalCategorySlug, slugify } from '@/lib/slug';

function getBaseUrl() {
  const envUrl = process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_BASE_URL;
  if (!envUrl) {
    return 'https://www.nareswarigaleri.com';
  }
  return envUrl.replace(/\/$/, '');
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
      SELECT p.id, p.nama_paket, p.created_at, kp.nama_kategori, kp.sub_kategori, kp.code_kategori
      FROM produk p
      JOIN kategori_produk kp ON kp.id = p.kategori_produk_id
    `).all();

    const categoryMap = new Map();

    for (const product of products) {
      const canonicalCategory = canonicalCategorySlug(product);
      const createdAt = product.created_at || now.toISOString();
      if (canonicalCategory) {
        const existing = categoryMap.get(canonicalCategory);
        if (!existing || new Date(createdAt) > new Date(existing)) {
          categoryMap.set(canonicalCategory, createdAt);
        }
      }

      const productSlug = slugify(product.nama_paket || '');
      if (!productSlug || !canonicalCategory) continue;

      entries.push({
        url: `${baseUrl}/${canonicalCategory}/${productSlug}`,
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
