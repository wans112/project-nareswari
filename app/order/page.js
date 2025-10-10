'use client'

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';

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

export default function OrderPage() {
  const router = useRouter();
  const [form, setForm] = useState(initialForm);
  const [submittedData, setSubmittedData] = useState(null);
  const [errors, setErrors] = useState({});

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

  const handleSubmit = (event) => {
    event.preventDefault();
    const nextErrors = validate();
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;
    setSubmittedData(form);
  };

  const handleWhatsapp = () => {
    window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
  };

  const resetForm = () => {
    setForm(initialForm);
    setSubmittedData(null);
    setErrors({});
  };

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-900 py-12 px-4">
      <Card className="max-w-3xl mx-auto">
        <CardHeader>
          <CardTitle>Form Pemesanan</CardTitle>
          <CardDescription>
            Lengkapi data diri dan jadwal acara. Setelah mengirim form, ikuti instruksi pembayaran untuk menyelesaikan pemesanan.
          </CardDescription>
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
              <Button type="submit">Kirim Form</Button>
              {submittedData && (
                <Button type="button" variant="ghost" onClick={resetForm}>Isi ulang</Button>
              )}
            </div>
          </form>
        </CardContent>

        {submittedData && (
          <>
            <Separator className="my-0" />
            <CardFooter className="flex flex-col gap-4 text-sm text-muted-foreground">
              <Alert>
                <AlertTitle>Langkah selanjutnya</AlertTitle>
                <AlertDescription>
                  Terima kasih, {submittedData.nama}. Silakan lakukan pembayaran DP minimal {formattedDp} ke rekening {bankInstructions.bank} {bankInstructions.rekening} a.n. {bankInstructions.nama}. Kirim bukti transfer melalui WhatsApp agar tanggal {submittedData.tanggal} dapat kami kunci.
                </AlertDescription>
              </Alert>

              <p>Jika Anda membutuhkan bantuan atau ingin melakukan negosiasi paket, hubungi tim kami melalui WhatsApp atau email. Kami akan mengonfirmasi pembayaran dalam waktu 1x24 jam kerja.</p>

              <div className="flex gap-3 flex-wrap">
                <Button type="button" variant="outline" onClick={handleWhatsapp}>
                  Hubungi via WhatsApp
                </Button>
                <Button type="button" variant="ghost" onClick={() => router.push('/')}>Kembali ke beranda</Button>
              </div>
            </CardFooter>
          </>
        )}
      </Card>
    </div>
  );
}
