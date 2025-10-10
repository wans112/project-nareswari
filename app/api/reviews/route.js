import { NextResponse } from 'next/server';
import { init } from '@/lib/db';

function normalizeRating(value) {
  const num = Number(value);
  if (!Number.isFinite(num)) return null;
  if (num < 1) return 1;
  if (num > 5) return 5;
  return Math.round(num);
}

export async function GET() {
  try {
    const db = await init();
    const rows = db
      .prepare(
        `SELECT id, nama, rating, isi, href, sumber, created_at
         FROM reviews
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
    const nama = body?.nama ? String(body.nama).trim() : '';
    const isi = body?.isi ? String(body.isi).trim() : '';
    const href = body?.href ? String(body.href).trim() : null;
    const sumber = body?.sumber ? String(body.sumber).trim() : null;
    const rating = normalizeRating(body?.rating);

    if (!nama) return NextResponse.json({ error: 'nama diperlukan' }, { status: 422 });
    if (!isi) return NextResponse.json({ error: 'isi diperlukan' }, { status: 422 });
    if (rating === null) return NextResponse.json({ error: 'rating tidak valid' }, { status: 422 });

    const stmt = db.prepare('INSERT INTO reviews (nama, rating, isi, href, sumber) VALUES (?, ?, ?, ?, ?)');
    const info = stmt.run(nama, rating, isi, href, sumber);
    const newId = info.lastInsertROWID || info.lastInsertRowid || info.lastInsertId;
    const created = db.prepare('SELECT id, nama, rating, isi, href, sumber, created_at FROM reviews WHERE id = ?').get(newId);
    return NextResponse.json(created, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PUT(req) {
  try {
    const db = await init();
    const url = new URL(req.url);
    const id = url.searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'id diperlukan' }, { status: 422 });

    const body = await req.json();
    const fields = {};

    if (body?.nama !== undefined) {
      const nama = String(body.nama).trim();
      if (!nama) return NextResponse.json({ error: 'nama tidak boleh kosong' }, { status: 422 });
      fields.nama = nama;
    }

    if (body?.isi !== undefined) {
      const isi = String(body.isi).trim();
      if (!isi) return NextResponse.json({ error: 'isi tidak boleh kosong' }, { status: 422 });
      fields.isi = isi;
    }

    if (body?.href !== undefined) {
      const href = body.href === null ? null : String(body.href).trim();
      fields.href = href && href.length > 0 ? href : null;
    }

    if (body?.sumber !== undefined) {
      const sumber = body.sumber === null ? null : String(body.sumber).trim();
      fields.sumber = sumber && sumber.length > 0 ? sumber : null;
    }

    if (body?.rating !== undefined) {
      const rating = normalizeRating(body.rating);
      if (rating === null) return NextResponse.json({ error: 'rating tidak valid' }, { status: 422 });
      fields.rating = rating;
    }

    const keys = Object.keys(fields);
    if (keys.length === 0) {
      return NextResponse.json({ error: 'Tidak ada perubahan' }, { status: 422 });
    }

    const assignments = keys.map((k) => `${k} = ?`).join(', ');
    const values = keys.map((k) => fields[k]);
    values.push(id);

    db.prepare(`UPDATE reviews SET ${assignments} WHERE id = ?`).run(...values);

    const updated = db.prepare('SELECT id, nama, rating, isi, href, sumber, created_at FROM reviews WHERE id = ?').get(id);
    if (!updated) return NextResponse.json({ error: 'Data tidak ditemukan' }, { status: 404 });
    return NextResponse.json(updated, { status: 200 });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(req) {
  try {
    const db = await init();
    const url = new URL(req.url);
    const id = url.searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'id diperlukan' }, { status: 422 });

    const existing = db.prepare('SELECT id FROM reviews WHERE id = ?').get(id);
    if (!existing) return NextResponse.json({ error: 'Data tidak ditemukan' }, { status: 404 });

    db.prepare('DELETE FROM reviews WHERE id = ?').run(id);
    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
