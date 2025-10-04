"use client"

import React, { useEffect, useState, useMemo } from 'react'
import { Card, CardHeader, CardTitle, CardContent, CardFooter, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'

export default function DetailProduk({ id, product, onOrder }) {
  const [prod, setProd] = useState(product || null);
  const [media, setMedia] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [activeIdx, setActiveIdx] = useState(0);
  const [allBenefits, setAllBenefits] = useState([]);

  useEffect(() => {
    if (!prod && id) {
      setLoading(true);
      fetch(`/api/produk?id=${encodeURIComponent(id)}`)
        .then(r => r.json())
        .then(j => { if (j?.error) throw new Error(j.error); setProd(j); })
        .catch(e => setError(e.message || 'Gagal memuat produk'))
        .finally(() => setLoading(false));
    }
  }, [id, prod]);

  useEffect(() => {
    const pid = prod?.id || id;
    if (!pid) return;
    fetch(`/api/media?produk_id=${encodeURIComponent(pid)}`)
      .then(r => r.json())
      .then(j => { if (Array.isArray(j)) setMedia(j); })
      .catch(() => {});
  }, [prod, id]);

  // Fetch all benefits metadata for grouping by kategori
  useEffect(() => {
    fetch('/api/benefit')
      .then(r => r.json())
      .then(j => { if (Array.isArray(j)) setAllBenefits(j); })
      .catch(() => {});
  }, []);

  const groupedBenefits = useMemo(() => {
    const result = new Map();
    const items = Array.isArray(prod?.benefits) ? prod.benefits : [];
    if (!items.length) return [];

    const getObj = (b) => {
      if (!b) return null;
      if (typeof b === 'object') {
        // Could be { id, benefit, nama_kategori } or similar
        const idVal = b.id ?? b.benefit_id;
        if (idVal != null) {
          const found = allBenefits.find(x => x.id === idVal);
          return found || { benefit: b.benefit || String(idVal), nama_kategori: b.nama_kategori || 'Lainnya' };
        }
        if (b.benefit) return { benefit: b.benefit, nama_kategori: b.nama_kategori || 'Lainnya' };
        return null;
      }
      if (typeof b === 'number') {
        const found = allBenefits.find(x => x.id === b);
        return found || { benefit: String(b), nama_kategori: 'Lainnya' };
      }
      if (typeof b === 'string') {
        const found = allBenefits.find(x => x.benefit === b);
        return found || { benefit: b, nama_kategori: 'Lainnya' };
      }
      return null;
    };

    for (const b of items) {
      const obj = getObj(b);
      if (!obj || !obj.benefit) continue;
      const kat = obj.nama_kategori || 'Lainnya';
      if (!result.has(kat)) result.set(kat, new Set());
      result.get(kat).add(obj.benefit);
    }

    // Convert to array of { kategori, items: [] } preserving insertion order
    return Array.from(result.entries()).map(([kategori, set]) => ({ kategori, items: Array.from(set.values()) }));
  }, [prod?.benefits, allBenefits]);

  if (loading) return <div>Memuat...</div>;
  if (error) return <div className="text-destructive">{error}</div>;
  if (!prod) return <div>Tidak ada produk</div>;

  const price = prod.harga ? new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(prod.harga) : 'Hubungi kami';

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-900 py-8 px-4">
      <Card className="max-w-4xl mx-auto shadow-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-black">
        <CardHeader className="pb-6">
          <div className="flex flex-col lg:flex-row items-start gap-6">
            {/* Main Image */}
            <div className="w-full lg:w-80 h-80 bg-neutral-100 dark:bg-neutral-800 rounded-xl flex items-center justify-center overflow-hidden shadow-lg ring-1 ring-neutral-200 dark:ring-neutral-800">
              {media && media.length > 0 ? (
                <img 
                  src={media[activeIdx].url} 
                  alt={prod.nama_paket} 
                  className="object-cover w-full h-full transition-transform hover:scale-105" 
                />
              ) : (
                <div className="text-center text-gray-500 dark:text-gray-400">
                  <div className="w-16 h-16 mx-auto mb-2 bg-gray-300 dark:bg-gray-600 rounded-full flex items-center justify-center">
                    <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z"/>
                    </svg>
                  </div>
                  <p className="text-sm">No image</p>
                </div>
              )}
            </div>
            
            {/* Product Info */}
            <div className="flex-1 space-y-4">
              <div>
                <CardTitle className="text-2xl lg:text-3xl font-bold text-neutral-900 dark:text-neutral-100">
                  {prod.nama_paket}
                </CardTitle>
                <CardDescription className="text-base mt-2 flex items-center gap-2">
                  <Badge variant="outline" className="text-xs border-neutral-300 text-neutral-700 dark:border-neutral-700 dark:text-neutral-200">
                    {prod.nama_kategori}
                  </Badge>
                  {prod.sub_kategori && (
                    <>
                      <span className="text-gray-400">•</span>
                      <span>{prod.sub_kategori}</span>
                    </>
                  )}
                </CardDescription>
              </div>
              
              <Separator />
              
              <div className="space-y-2">
                <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">Harga Paket</p>
                <div className="text-3xl font-bold text-neutral-900 dark:text-neutral-100">
                  {price}
                </div>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="px-6 pb-6">
          <div className="space-y-6">
            {/* Benefits Section */}
            <div>
              <h4 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <div className="w-2 h-6 bg-neutral-900 dark:bg-neutral-100 rounded-full"></div>
                Benefits Package
              </h4>
              {groupedBenefits.length > 0 ? (
                <div className="grid gap-4">
                  {groupedBenefits.map(group => (
                    <div key={group.kategori} className="bg-neutral-50 dark:bg-neutral-900/40 rounded-lg p-4 border border-neutral-200 dark:border-neutral-800">
                      <div className="flex items-center gap-2 mb-3">
                        <Badge variant="outline" className="font-medium border-neutral-300 text-neutral-700 dark:border-neutral-700 dark:text-neutral-200">
                          {group.kategori}
                        </Badge>
                        <span className="text-xs text-gray-500">({group.items.length} items)</span>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {group.items.map((name, idx) => (
                          <div key={name + idx} className="flex items-center gap-2 text-sm text-neutral-800 dark:text-neutral-200">
                            <div className="w-1.5 h-1.5 bg-neutral-900 dark:bg-neutral-100 rounded-full"></div>
                            <span className="text-gray-700 dark:text-gray-300">{name}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 bg-neutral-50 dark:bg-neutral-900/40 rounded-lg border border-neutral-200 dark:border-neutral-800">
                  <div className="w-12 h-12 mx-auto mb-3 bg-neutral-200 dark:bg-neutral-700 rounded-full flex items-center justify-center">
                    <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Tidak ada benefit terdaftar</p>
                </div>
              )}
            </div>

            {/* Image Gallery */}
            {media && media.length > 1 && (
              <div>
                <h4 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <div className="w-2 h-6 bg-neutral-900 dark:bg-neutral-100 rounded-full"></div>
                  Gallery
                </h4>
                <div className="flex gap-3 overflow-x-auto pb-2">
                  {media.map((m, idx) => (
                    <button 
                      key={m.id || m.media_path || idx} 
                      onClick={() => setActiveIdx(idx)} 
                      className={`flex-shrink-0 w-20 h-16 rounded-lg overflow-hidden border-2 transition-all ${
                        idx === activeIdx 
                          ? 'ring-2 ring-neutral-900 border-neutral-900 dark:ring-neutral-100 dark:border-neutral-100 shadow-md' 
                          : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 opacity-80 hover:opacity-100'
                      }`}
                    >
                      <img src={m.url} alt={`thumb-${idx}`} className="object-cover w-full h-full" />
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </CardContent>
        
        <CardFooter className="px-6 pt-4 bg-neutral-50 dark:bg-neutral-900 border-t border-neutral-200 dark:border-neutral-800">
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
              </svg>
              Paket Wedding Premium
            </div>
            <Button 
              size="lg" 
              onClick={() => onOrder ? onOrder(prod) : alert('Order: ' + prod.nama_paket)}
              className="bg-black text-white hover:bg-neutral-800 dark:bg-white dark:text-black dark:hover:bg-neutral-200 shadow-lg hover:shadow-xl transition-all duration-300 px-8"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10m0 0V6a2 2 0 00-2-2H9a2 2 0 00-2 2v2m0 0v8a2 2 0 002 2h6a2 2 0 002-2V8M9 12h6" />
              </svg>
              Pesan Sekarang
            </Button>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}
