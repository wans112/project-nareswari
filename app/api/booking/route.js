import { NextResponse } from 'next/server';
import { init } from '@/lib/db';
import fs from 'fs/promises';
import path from 'path';

export async function GET() {
  try {
    const db = await init();
    const rows = db
      .prepare(
        `SELECT id, produk_id, nama, email, telepon, tanggal, catatan, image_path, status, created_at
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

    const contentType = req.headers.get('content-type') || '';

    let produk_id = null;
    let nama = '';
    let email = '';
    let telepon = '';
    let tanggal = '';
    let catatan = '';
    let image_path = null;

    if (contentType.includes('multipart/form-data') || contentType.includes('application/x-www-form-urlencoded')) {
      const formData = await req.formData();
      produk_id = formData.get('produk_id') ? Number(formData.get('produk_id')) : null;
      nama = formData.get('nama')?.toString().trim() || '';
      email = formData.get('email')?.toString().trim() || '';
      telepon = formData.get('telepon')?.toString().trim() || '';
      tanggal = formData.get('tanggal')?.toString().trim() || '';
      catatan = formData.get('catatan')?.toString().trim() || '';

      const buktiFile = formData.get('bukti_transfer');
      if (buktiFile && buktiFile.size > 0) {
        const buffer = await buktiFile.arrayBuffer();
        const filename = `${Date.now()}-${buktiFile.name}`;
        const dir = path.join(process.cwd(), 'database', 'bukti_transfer');
        await fs.mkdir(dir, { recursive: true });
        const filepath = path.join(dir, filename);
        await fs.writeFile(filepath, Buffer.from(buffer));
        image_path = `bukti_transfer/${filename}`;
      }
    } else if (contentType.includes('application/json')) {
      const body = await req.json();
      produk_id = body?.produk_id ? Number(body.produk_id) : null;
      nama = body?.nama ? String(body.nama).trim() : '';
      email = body?.email ? String(body.email).trim() : '';
      telepon = body?.telepon ? String(body.telepon).trim() : '';
      tanggal = body?.tanggal ? String(body.tanggal).trim() : '';
      catatan = body?.catatan ? String(body.catatan).trim() : '';
      // image_path remains null on JSON path (no file)
    } else {
      return NextResponse.json({ error: 'Unsupported Content-Type' }, { status: 415 });
    }

    if (!nama) return NextResponse.json({ error: 'nama diperlukan' }, { status: 422 });
    if (!email) return NextResponse.json({ error: 'email diperlukan' }, { status: 422 });
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return NextResponse.json({ error: 'format email tidak valid' }, { status: 422 });
    if (!telepon) return NextResponse.json({ error: 'telepon diperlukan' }, { status: 422 });
    if (!tanggal) return NextResponse.json({ error: 'tanggal diperlukan' }, { status: 422 });

    const stmt = db.prepare('INSERT INTO booking (produk_id, nama, email, telepon, tanggal, catatan, image_path) VALUES (?, ?, ?, ?, ?, ?, ?)');
    const info = stmt.run(produk_id, nama, email, telepon, tanggal, catatan, image_path);
    const newId = info.lastInsertROWID || info.lastInsertRowid || info.lastInsertId;
    const created = db.prepare('SELECT id, produk_id, nama, email, telepon, tanggal, catatan, image_path, status, created_at FROM booking WHERE id = ?').get(newId);
    return NextResponse.json(created, { status: 201 });
  } catch (err) {
    console.error('POST booking error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PUT(req) {
  const url = new URL(req.url);
  const id = url.searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'id diperlukan' }, { status: 400 });

  try {
    const db = await init();
    const formData = await req.formData();
    const buktiFile = formData.get('bukti_transfer');
    if (!buktiFile || buktiFile.size === 0) return NextResponse.json({ error: 'file diperlukan' }, { status: 422 });

    const buffer = await buktiFile.arrayBuffer();
    const filename = `${Date.now()}-${buktiFile.name}`;
    const filepath = path.join(process.cwd(), 'database', 'bukti_transfer', filename);
    await fs.writeFile(filepath, Buffer.from(buffer));
    const image_path = `bukti_transfer/${filename}`;

    const stmt = db.prepare('UPDATE booking SET image_path = ?, status = ? WHERE id = ?');
    const info = stmt.run(image_path, 'menunggu konfirmasi', id);
    if (info.changes === 0) return NextResponse.json({ error: 'booking tidak ditemukan' }, { status: 404 });

    const updated = db.prepare('SELECT id, produk_id, nama, email, telepon, tanggal, catatan, image_path, status, created_at FROM booking WHERE id = ?').get(id);
    return NextResponse.json(updated, { status: 200 });
  } catch (err) {
    console.error('PUT booking error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}