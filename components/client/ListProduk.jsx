"use client"

import Link from 'next/link'
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from "react";

import { Card, CardHeader, CardTitle, CardContent } from "../ui/card";
import { Badge } from "../ui/badge";
import { Separator } from "../ui/separator";
import { Alert, AlertTitle, AlertDescription } from "../ui/alert";
import { Skeleton } from "../ui/skeleton";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "../ui/select";

const slugify = (text = '') =>
  String(text)
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');

const formatTitleFromSlug = (slug = '') =>
  slug
    .split('-')
    .filter(Boolean)
    .map(part => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');

export default function ListProduk({ category }) {
  const router = useRouter();
  const categorySlug = useMemo(() => slugify(category || ''), [category]);
  const [allProducts, setAllProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSubcategory, setSelectedSubcategory] = useState('all');
  const [priceMin, setPriceMin] = useState('');
  const [priceMax, setPriceMax] = useState('');
  const [sortBy, setSortBy] = useState('random');

  useEffect(() => {
    let mounted = true;
    async function load() {
      setLoading(true);
      try {
        const res = await fetch('/api/produk');
        if (!res.ok) throw new Error(`Fetch failed: ${res.status}`);
        const data = await res.json();
        if (!mounted) return;

        const filtered = Array.isArray(data)
          ? data.filter(p => {
              const itemCategory = slugify(p?.nama_kategori || '');
              const itemSub = slugify(p?.sub_kategori || '');
              if (!categorySlug) return Boolean(itemCategory || itemSub);
              return categorySlug === itemCategory || (!!itemSub && categorySlug === itemSub);
            })
          : [];

        setAllProducts(filtered);
        setError(null);
      } catch (err) {
        setError(err.message || 'Error loading packages');
      } finally {
        if (mounted) setLoading(false);
      }
    }
    load();
    return () => { mounted = false; };
  }, [categorySlug]);

  const subcategoryOptions = useMemo(() => {
    if (!Array.isArray(allProducts)) return [];
    const map = new Map();
    for (const item of allProducts) {
      const label = item?.sub_kategori || item?.nama_kategori || 'Tanpa Subkategori';
      const value = slugify(item?.sub_kategori || item?.nama_kategori || '');
      if (!value) continue;
      if (!map.has(value)) map.set(value, label);
    }
    return Array.from(map.entries()).map(([value, label]) => ({ value, label }));
  }, [allProducts]);

  const filteredProducts = useMemo(() => {
    const byCategory = Array.isArray(allProducts) ? allProducts : [];
    const min = priceMin ? Number(priceMin) : null;
    const max = priceMax ? Number(priceMax) : null;
    const filtered = byCategory.filter(item => {
      if (!item) return false;
      const name = String(item?.nama_paket || '').toLowerCase();
      if (searchTerm && !name.includes(searchTerm.toLowerCase())) return false;

      if (selectedSubcategory !== 'all') {
        const subValue = slugify(item?.sub_kategori || item?.nama_kategori || '');
        if (!subValue || subValue !== selectedSubcategory) return false;
      }

      const priceValue = Number(item?.harga ?? NaN);
      if (min !== null) {
        if (Number.isNaN(priceValue) || priceValue < min) return false;
      }
      if (max !== null) {
        if (Number.isNaN(priceValue) || priceValue > max) return false;
      }
      return true;
    });

    if (sortBy === 'price-asc') {
      return filtered.sort((a, b) => (a.harga || 0) - (b.harga || 0));
    }
    if (sortBy === 'price-desc') {
      return filtered.sort((a, b) => (b.harga || 0) - (a.harga || 0));
    }
    if (sortBy === 'random') {
      return filtered.sort(() => Math.random() - 0.5);
    }
    return filtered;
  }, [allProducts, searchTerm, selectedSubcategory, priceMin, priceMax, sortBy]);

  const packages = useMemo(() => {
    return filteredProducts.map(p => {
      const itemCategorySlug = slugify(p?.nama_kategori || categorySlug || 'produk');
      const productSlug = slugify(p?.nama_paket || p?.title || 'paket');
      return {
        id: p.id,
        title: p.nama_paket || 'Paket',
        price: p.harga ? `Rp${Number(p.harga).toLocaleString('id-ID')}` : 'Hubungi kami',
        features: Array.isArray(p.benefits) ? p.benefits : [],
        href: `/${itemCategorySlug}/${productSlug}`,
      };
    });
  }, [filteredProducts, categorySlug]);

  const hasActiveFilters = Boolean(
    searchTerm.trim() ||
    priceMin.trim() ||
    priceMax.trim() ||
    (selectedSubcategory !== 'all') ||
    (sortBy !== 'random')
  );

  const titleText = categorySlug ? `Paket ${formatTitleFromSlug(categorySlug)}` : 'Daftar Paket';
  const subtitleText = categorySlug
    ? `Pilih paket ${formatTitleFromSlug(categorySlug)} — klik kartu untuk melihat detail.`
    : 'Pilih paket yang sesuai kebutuhan — klik kartu untuk melihat detail.';

  return (
    <section id="pernikahan-list" className="w-full py-12">
      <div className="max-w-6xl mx-auto px-6">
        <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
          <div className="flex flex-col items-start gap-3">
            <Button
              type="button"
              variant="outline"
              className="gap-2"
              onClick={() => router.back()}
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M15 18l-6-6 6-6" />
              </svg>
              Kembali
            </Button>
            <div>
              <h1 className="text-3xl font-extrabold">{titleText}</h1>
              <p className="text-muted-foreground mt-2">{subtitleText}</p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-end gap-4 mb-8">
          <div className="w-full md:w-64">
            <label className="block text-sm font-medium text-muted-foreground mb-1">Cari paket</label>
            <Input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Cari berdasarkan nama paket"
            />
          </div>

          <div className="w-full sm:w-56 md:w-48">
            <label className="block text-sm font-medium text-muted-foreground mb-1">Subkategori</label>
            <Select value={selectedSubcategory} onValueChange={setSelectedSubcategory}>
              <SelectTrigger>
                <SelectValue placeholder="Pilih subkategori" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua subkategori</SelectItem>
                {subcategoryOptions.map(option => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="w-full sm:w-56 md:w-48">
            <label className="block text-sm font-medium text-muted-foreground mb-1">Urutkan</label>
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger>
                <SelectValue placeholder="Urutkan berdasarkan" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="price-asc">Harga terendah</SelectItem>
                <SelectItem value="price-desc">Harga tertinggi</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-wrap sm:flex-nowrap gap-4 w-full sm:w-auto">
            <div className="w-full sm:w-36">
              <label className="block text-sm font-medium text-muted-foreground mb-1">Harga minimum</label>
              <Input
                type="number"
                inputMode="numeric"
                min="0"
                placeholder="0"
                value={priceMin}
                onChange={(e) => setPriceMin(e.target.value)}
              />
            </div>
            <div className="w-full sm:w-36">
              <label className="block text-sm font-medium text-muted-foreground mb-1">Harga maksimum</label>
              <Input
                type="number"
                inputMode="numeric"
                min="0"
                placeholder="Tanpa batas"
                value={priceMax}
                onChange={(e) => setPriceMax(e.target.value)}
              />
            </div>
          </div>

          {hasActiveFilters && (
            <Button
              type="button"
              variant="ghost"
              onClick={() => {
                setSearchTerm('');
                setSelectedSubcategory('all');
                setPriceMin('');
                setPriceMax('');
                setSortBy('random');
              }}
            >
              Reset filter
            </Button>
          )}
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
        ) : packages.length === 0 ? (
          <Alert className="mb-8">
            <AlertTitle>Tidak ada paket</AlertTitle>
            <AlertDescription>
              {hasActiveFilters
                ? 'Tidak ditemukan paket yang cocok dengan filter yang dipilih.'
                : 'Belum ada paket yang tersedia untuk kategori ini.'}
            </AlertDescription>
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

