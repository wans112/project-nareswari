"use client"

import Link from 'next/link'
import { Card, CardHeader, CardTitle, CardContent } from "../ui/card";
import { Badge } from "../ui/badge";
import { Separator } from "../ui/separator";
import { Alert, AlertTitle, AlertDescription } from "../ui/alert";
import { Skeleton } from "../ui/skeleton";

import { useEffect, useState } from "react";

// packages will be loaded from the produk API (filtered by kategori 'pernikahan')
const initialPackages = [];

export default function ListPernikahan() {
  const [packages, setPackages] = useState(initialPackages);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let mounted = true;
    async function load() {
      setLoading(true);
      try {
        const res = await fetch('/api/produk');
        if (!res.ok) throw new Error(`Fetch failed: ${res.status}`);
        const data = await res.json();
        if (!mounted) return;
        // filter produk where nama_kategori equals 'pernikahan' (case-insensitive)
        const pernikahan = Array.isArray(data)
          ? data.filter(p => p.nama_kategori && String(p.nama_kategori).toLowerCase() === 'pernikahan')
          : [];
        // map to the UI-friendly shape
        // slugify helper to produce same slugs as app/[slug]/page.js
        const slugify = (text = '') => String(text).toLowerCase().normalize('NFKD').replace(/[^a-z0-9\s-]/g, '').trim().replace(/\s+/g, '-').replace(/-+/g, '-');
        const mapped = pernikahan.map(p => ({
          id: p.id,
          title: p.nama_paket || 'Paket',
          price: p.harga ? `Rp${Number(p.harga).toLocaleString('id-ID')}` : 'Hubungi kami',
          features: p.benefits && Array.isArray(p.benefits) ? p.benefits : [],
          href: `/${slugify(p.nama_paket || p.title)}`
        }));
        setPackages(mapped);
        setError(null);
      } catch (err) {
        setError(err.message || 'Error loading packages');
      } finally {
        if (mounted) setLoading(false);
      }
    }
    load();
    return () => { mounted = false; };
  }, []);

  return (
    <section id="pernikahan-list" className="w-full py-12">
      <div className="max-w-6xl mx-auto px-6">
        <div className="flex items-end justify-between gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-extrabold">Paket Pernikahan</h1>
            <p className="text-muted-foreground mt-2">Pilih paket yang sesuai kebutuhan — klik kartu untuk melihat detail.</p>
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, idx) => (
              <Card key={idx} className="h-full p-6">
                <div className="space-y-4">
                  <Skeleton className="h-6 w-3/4" />
                  <Skeleton className="h-4 w-1/3" />
                  <Separator />
                  <div className="space-y-2">
                    <Skeleton className="h-3 w-full" />
                    <Skeleton className="h-3 w-5/6" />
                    <Skeleton className="h-3 w-2/3" />
                  </div>
                </div>
              </Card>
            ))}
          </div>
        ) : error ? (
          <Alert variant="destructive" className="mb-8">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
            <AlertTitle>Gagal memuat paket</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {packages.map((p) => (
              <article key={p.id} id={String(p.id)}>
                <Link href={p.href} className="block rounded-xl focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-primary">
                  <Card className="h-full flex flex-col border hover:border-foreground/20 hover:shadow-xl transition-all duration-300 ease-out group">
                    <CardHeader className="pb-2">
                      <CardTitle className="flex items-start justify-between gap-4">
                        <span className="text-lg font-semibold leading-tight group-hover:underline underline-offset-4">
                          {p.title}
                        </span>
                        <Badge variant="outline" className="whitespace-nowrap">{p.price}</Badge>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-2 pb-6 flex-1">
                      <Separator className="my-3" />
                      <ul className="space-y-2 text-sm text-muted-foreground">
                        {p.features && p.features.length > 0 ? (
                          p.features.slice(0, 6).map((f, i) => (
                            <li key={i} className="flex items-start gap-2">
                              <span className="mt-1 inline-block size-1.5 rounded-full bg-foreground/70" />
                              <span>
                                {typeof f === 'string' ? f : (typeof f === 'number' ? String(f) : (f?.benefit || 'Benefit'))}
                              </span>
                            </li>
                          ))
                        ) : (
                          <li className="flex items-start gap-2">
                            <span className="mt-1 inline-block size-1.5 rounded-full bg-foreground/30" />
                            <span>Tidak ada fitur terdaftar</span>
                          </li>
                        )}
                      </ul>
                      {p.features && p.features.length > 6 && (
                        <div className="mt-3 text-xs text-muted-foreground">+{p.features.length - 6} fitur lainnya</div>
                      )}
                    </CardContent>
                  </Card>
                </Link>
              </article>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
