import { NextResponse } from 'next/server';
import { init } from '@/lib/db';

export async function GET() {
  try {
    const db = await init();
    const rows = db
      .prepare(
        `SELECT id, produk_id, nama, email, telepon, tanggal, catatan, status, created_at
         FROM booking
         ORDER BY id DESC`
      )
      .all();
    return NextResponse.json(rows, { status: 200 });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const db = await init();
    const body = await req.json();
    const produk_id = body?.produk_id ? Number(body.produk_id) : null;
    const nama = body?.nama ? String(body.nama).trim() : '';
    const email = body?.email ? String(body.email).trim() : '';
    const telepon = body?.telepon ? String(body.telepon).trim() : '';
    const tanggal = body?.tanggal ? String(body.tanggal).trim() : '';
    const catatan = body?.catatan ? String(body.catatan).trim() : '';

    if (!nama) return NextResponse.json({ error: 'nama diperlukan' }, { status: 422 });
    if (!email) return NextResponse.json({ error: 'email diperlukan' }, { status: 422 });
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return NextResponse.json({ error: 'format email tidak valid' }, { status: 422 });
    if (!telepon) return NextResponse.json({ error: 'telepon diperlukan' }, { status: 422 });
    if (!tanggal) return NextResponse.json({ error: 'tanggal diperlukan' }, { status: 422 });

    const stmt = db.prepare('INSERT INTO booking (produk_id, nama, email, telepon, tanggal, catatan) VALUES (?, ?, ?, ?, ?, ?)');
    const info = stmt.run(produk_id, nama, email, telepon, tanggal, catatan);
    const newId = info.lastInsertROWID || info.lastInsertRowid || info.lastInsertId;
    const created = db.prepare('SELECT id, produk_id, nama, email, telepon, tanggal, catatan, status, created_at FROM booking WHERE id = ?').get(newId);
    return NextResponse.json(created, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}