'use client'

import { useMemo, useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { ArrowLeft } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

const initialForm = {
  nama: '',
  email: '',
  telepon: '',
  tanggal: '',
  catatan: '',
};

const bankInstructions = {
  bank: 'BCA',
  rekening: '1234567890',
  nama: 'Nareswari Event',
};

const whatsappUrl = 'https://wa.me/6281234567890';

const MIN_DP = 1000000;

export default function OrderForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [form, setForm] = useState(initialForm);
  const [submittedData, setSubmittedData] = useState(null);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [produkId, setProdukId] = useState(null);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [successDialogOpen, setSuccessDialogOpen] = useState(false);

  useEffect(() => {
    const produk_id = searchParams.get('produk_id');
    if (produk_id) {
      const id = Number(produk_id);
      setProdukId(id);
      
      // Fetch product details
      fetch(`/api/produk?id=${id}`)
        .then(r => r.json())
        .then(data => {
          if (data && !data.error) {
            setSelectedProduct(data);
          }
        })
        .catch(() => {});
    }
  }, [searchParams]);

  const formattedDp = useMemo(() => new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(MIN_DP), []);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const validate = () => {
    const nextErrors = {};
    if (!form.nama.trim()) nextErrors.nama = 'Nama wajib diisi';
    if (!form.email.trim()) nextErrors.email = 'Email wajib diisi';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) nextErrors.email = 'Format email tidak valid';
    if (!form.telepon.trim()) nextErrors.telepon = 'Nomor telepon wajib diisi';
    if (!form.tanggal) nextErrors.tanggal = 'Tanggal acara wajib diisi';
    return nextErrors;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const nextErrors = validate();
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    setIsSubmitting(true);
    try {
      const response = await fetch('/api/booking', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          produk_id: produkId,
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Gagal mengirim form');
      }
      setSubmittedData(data);
      setSuccessDialogOpen(true);
    } catch (err) {
      setErrors({ submit: err.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleWhatsapp = () => {
    window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
  };

  const resetForm = () => {
    setForm(initialForm);
    setSubmittedData(null);
    setErrors({});
    setSuccessDialogOpen(false);
  };

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-900 py-12 px-4">
      <Card className="max-w-3xl mx-auto">
        <CardHeader>
          <div className="flex items-center gap-2 mb-2">
            <Button variant="ghost" size="sm" onClick={() => router.back()}>
              <ArrowLeft className="h-4 w-4 mr-1" />
              Kembali
            </Button>
          </div>
          <CardTitle>Form Pemesanan</CardTitle>
          <CardDescription>
            Lengkapi data diri dan jadwal acara. Setelah mengirim form, ikuti instruksi pembayaran untuk menyelesaikan pemesanan.
          </CardDescription>
          {selectedProduct && (
            <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
              <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">Produk yang dipilih:</h3>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-blue-800 dark:text-blue-200">{selectedProduct.nama_paket}</p>
                  <p className="text-sm text-blue-600 dark:text-blue-300">{selectedProduct.nama_kategori}</p>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-blue-900 dark:text-blue-100">
                    {selectedProduct.harga ? new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(selectedProduct.harga) : 'Hubungi kami'}
                  </p>
                </div>
              </div>
            </div>
          )}
        </CardHeader>
        <CardContent>
          <form className="space-y-6" onSubmit={handleSubmit} noValidate>
            <div className="space-y-2">
              <Label htmlFor="nama">Nama Lengkap</Label>
              <Input id="nama" name="nama" value={form.nama} onChange={handleChange} placeholder="Nama lengkap Anda" />
              {errors.nama && <p className="text-sm text-destructive">{errors.nama}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" name="email" type="email" value={form.email} onChange={handleChange} placeholder="alamat@email.com" />
              {errors.email && <p className="text-sm text-destructive">{errors.email}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="telepon">Nomor Telepon / WhatsApp</Label>
              <Input id="telepon" name="telepon" value={form.telepon} onChange={handleChange} placeholder="08xxxxxxxxxx" />
              {errors.telepon && <p className="text-sm text-destructive">{errors.telepon}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="tanggal">Tanggal Acara</Label>
              <Input id="tanggal" name="tanggal" type="date" value={form.tanggal} onChange={handleChange} />
              {errors.tanggal && <p className="text-sm text-destructive">{errors.tanggal}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="catatan">Catatan Tambahan (opsional)</Label>
              <Textarea id="catatan" name="catatan" value={form.catatan} onChange={handleChange} placeholder="Jelaskan kebutuhan khusus, durasi acara, atau detail lainnya" rows={4} />
            </div>

            <div className="flex items-center gap-3">
              <Button type="submit" className="!text-white" disabled={isSubmitting}>
                {isSubmitting ? 'Mengirim...' : 'Kirim Form'}
              </Button>
              {submittedData && (
                <Button type="button" variant="ghost" onClick={resetForm}>Isi ulang</Button>
              )}
            </div>
            {errors.submit && <p className="text-sm text-destructive">{errors.submit}</p>}
          </form>
        </CardContent>
      </Card>
      
      <Dialog open={successDialogOpen} onOpenChange={setSuccessDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-green-600">Pemesanan Berhasil!</DialogTitle>
            <DialogDescription>
              Terima kasih telah mempercayakan acara Anda kepada kami.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <Alert>
              <AlertTitle className="text-lg font-semibold">Langkah selanjutnya</AlertTitle>
              <AlertDescription>
                Terima kasih, {submittedData?.nama}. Silakan lakukan pembayaran DP minimal {formattedDp} ke rekening {bankInstructions.bank} {bankInstructions.rekening} a.n. {bankInstructions.nama}. Kirim bukti transfer melalui WhatsApp agar tanggal {submittedData?.tanggal} dapat kami kunci.
              </AlertDescription>
            </Alert>
          </div>

          <DialogFooter className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setSuccessDialogOpen(false);
                router.push('/');
              }}>
              Kembali ke beranda
            </Button>
            <Button className="!text-white" onClick={handleWhatsapp}>
              <i className="bi bi-whatsapp"></i>
              Hubungi via WhatsApp
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}