import Link from "next/link";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

const currencyFormatter = new Intl.NumberFormat("id-ID", {
  style: "currency",
  currency: "IDR",
  minimumFractionDigits: 0,
});

const dateFormatter = new Intl.DateTimeFormat("id-ID", {
  day: "numeric",
  month: "short",
  year: "numeric",
});

function formatDiscountValue({ persentase, nominal }) {
  const parts = [];
  if (persentase != null && !Number.isNaN(Number(persentase))) {
    parts.push(`${Number(persentase)}%`);
  }
  if (nominal != null && !Number.isNaN(Number(nominal))) {
    parts.push(currencyFormatter.format(Number(nominal)));
  }
  return parts.join(" atau ") || "Diskon Spesial";
}

function formatRange(mulai, berakhir) {
  const start = mulai ? dateFormatter.format(new Date(mulai)) : null;
  const end = berakhir ? dateFormatter.format(new Date(berakhir)) : null;
  if (start && end) return `${start} – ${end}`;
  if (start) return `Mulai ${start}`;
  if (end) return `Hingga ${end}`;
  return "Periode fleksibel";
}

export default function DiskonSection({ items = [] }) {
  if (!Array.isArray(items) || items.length === 0) {
    return null;
  }

  const limited = items.slice(0, 4);

  return (
    <section id="diskon" className="w-full min-h-screen bg-[#0f0f0f] text-white flex items-center snap-start">
      <div className="max-w-7xl mx-auto px-6 py-16 w-full space-y-8">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
          <div>
            <h2 className="text-3xl sm:text-4xl !font-extrabold">Diskon Terbaru</h2>
            <p className="text-muted-foreground text-sm sm:text-base text-white/70">
              Paket pilihan dengan penawaran terbaik saat ini. Maksimal empat promo ditampilkan.
            </p>
          </div>
          <Badge variant="outline" className="self-start border-white/40 text-white">
            Promo Aktif
          </Badge>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
          {limited.map((item) => (
            <Card key={item.id} className="h-full border border-white/10 bg-white/5 text-white backdrop-blur-sm shadow-lg">
              <CardHeader className="pb-2">
                <CardTitle className="text-xl font-semibold leading-tight">
                  {item.nama_diskon}
                </CardTitle>
                <CardDescription className="text-white/70">
                  {item.kategori_label}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 pt-2">
                <div className="space-y-1">
                  <p className="text-sm uppercase tracking-widest text-white/60">Potongan</p>
                  <p className="text-2xl font-bold">{formatDiscountValue(item)}</p>
                </div>
                <Separator className="bg-white/10" />
                <div className="space-y-1 text-sm">
                  <p className="font-medium text-white">{item.produk_nama}</p>
                  <p className="text-white/70">{item.deskripsi || "Promo spesial untuk paket pilihan."}</p>
                </div>
                <div className="rounded-lg bg-black/30 border border-white/10 px-3 py-2 text-xs text-white/70">
                  {formatRange(item.mulai, item.berakhir)}
                </div>
                {item.href ? (
                  <Link
                    href={item.href}
                    className="inline-flex items-center justify-center rounded-md border border-white/30 px-4 py-2 text-sm font-medium transition hover:border-white hover:bg-white hover:text-black"
                  >
                    Lihat Paket
                  </Link>
                ) : null}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
