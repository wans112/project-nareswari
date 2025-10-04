import { NextResponse } from 'next/server';
import { init } from '@/lib/db';

export async function GET() {
  try {
    const db = await init();
    const rows = db
      .prepare(
        `SELECT kb.id, kb.nama_kategori, COUNT(b.id) AS jumlah_benefit
         FROM kategori_benefit kb
         LEFT JOIN benefit b ON b.kategori_benefit_id = kb.id
         GROUP BY kb.id, kb.nama_kategori
         ORDER BY kb.nama_kategori`
      )
      .all();
    return NextResponse.json(rows, { status: 200 });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
