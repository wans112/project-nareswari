import "./globals.css";
import "antd/dist/reset.css";
import "@ant-design/v5-patch-for-react-19";
import Script from "next/script";

import Tracker from "@/components/microproses/Tracker";
import DiskonRefresh from "@/components/microproses/DiskonRefresh";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.nareswarigaleri.com";

export const metadata = {
  title: {
    default: "Nareswari Galeri | Layanan Wedding & Event Indramayu",
    template: "%s | Nareswari Galeri",
  },
  description:
    "Nareswari Galeri menyediakan layanan wedding planner, MUA, dekorasi, busana, dan dokumentasi profesional di Indramayu. Wujudkan momen bahagia Anda bersama kami.",
  keywords: [
    "nareswari",
    "nareswari galeri",
    "wedding indramayu",
    "makeup artist",
    "sewa kebaya",
    "event organizer",
    "dekorasi pernikahan",
    "paket pernikahan",
  ],
  metadataBase: new URL(siteUrl),
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "Nareswari Galeri | Layanan Wedding & Event Indramayu",
    description:
      "Solusi lengkap untuk pernikahan dan acara istimewa: MUA, busana, dekorasi, dokumentasi, dan perencanaan profesional.",
    url: siteUrl,
    siteName: "Nareswari Galeri",
    locale: "id_ID",
    type: "website",
    images: [
      {
        url: `${siteUrl}/og-cover.jpg`,
        width: 1200,
        height: 630,
        alt: "Nareswari Galeri - Wedding & Event Services",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Nareswari Galeri | Layanan Wedding & Event Indramayu",
    description:
      "Paket wedding lengkap: MUA, busana, dekorasi, dokumentasi, dan event planner profesional.",
    images: [`${siteUrl}/og-cover.jpg`],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
    },
  },
  category: "Wedding Services",
  authors: [{ name: "Nareswari Galeri", url: siteUrl }],
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#0f0f0f",
};

export default function RootLayout({ children }) {
  const organizationLdJson = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    name: "Nareswari Galeri",
    description:
      "Layanan wedding organizer, MUA, dekorasi, busana pengantin, dan dokumentasi profesional di Indramayu.",
    url: siteUrl,
    telephone: "+6287727694239",
    image: `${siteUrl}/og-cover.jpg`,
    address: {
      "@type": "PostalAddress",
      addressRegion: "Jawa Barat",
      addressLocality: "Indramayu",
      addressCountry: "ID",
    },
    geo: {
      "@type": "GeoCoordinates",
      latitude: "-6.3364",
      longitude: "108.3249",
    },
    areaServed: "Indramayu, Jawa Barat",
    priceRange: "$$",
    openingHoursSpecification: [
      {
        "@type": "OpeningHoursSpecification",
        dayOfWeek: [
          "Monday",
          "Tuesday",
          "Wednesday",
          "Thursday",
          "Friday",
          "Saturday",
        ],
        opens: "08:00",
        closes: "20:00",
      },
    ],
    sameAs: [
      "https://www.instagram.com/nareswari_galeri_indramayu",
      "https://www.facebook.com/share/1Zv5T1YeQz/",
    ],
  };

  return (
    <html lang="id">
      <body className="antialiased">
        <Tracker />
        <DiskonRefresh />
        {children}
        <Script id="ld-json" type="application/ld+json" strategy="afterInteractive">
          {JSON.stringify(organizationLdJson)}
        </Script>
      </body>
    </html>
  );
}
