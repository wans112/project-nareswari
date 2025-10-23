import { MetadataRoute } from 'next';

function getBaseUrl() {
  const envUrl = process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_BASE_URL;
  if (!envUrl) {
    return 'https://www.nareswarigaleri.com';
  }
  return envUrl.replace(/\/$/, '');
}

export default function robots() {
  const baseUrl = getBaseUrl();

  return {
    rules: [
      {
        userAgent: '*',
        allow: ['/', '/[slug]', '/[slug]/[product]', '/order'],
        disallow: [
          '/admin',
          '/dashboard-admin',
          '/api',
          '/api/*',
          '/media',
          '/database',
        ],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
