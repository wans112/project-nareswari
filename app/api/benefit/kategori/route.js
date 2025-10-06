import { NextResponse } from 'next/server';
import { init } from '@/lib/db';

function getInsertId(info) {
  return info.lastInsertROWID || info.lastInsertRowid || info.lastInsertId;
}

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

export async function POST(req) {
  try {
    const db = await init();
    const body = await req.json();
    const nama_kategori = body?.nama_kategori ? String(body.nama_kategori).trim() : '';
    if (!nama_kategori) {
      return NextResponse.json({ error: 'nama_kategori required' }, { status: 422 });
    }

    const existing = db
      .prepare('SELECT id, nama_kategori FROM kategori_benefit WHERE lower(nama_kategori) = lower(?)')
      .get(nama_kategori);
    if (existing) {
      return NextResponse.json(existing, { status: 200 });
    }

    const info = db
      .prepare('INSERT INTO kategori_benefit (nama_kategori) VALUES (?)')
      .run(nama_kategori);
    const id = getInsertId(info);
    const row = db
      .prepare('SELECT id, nama_kategori FROM kategori_benefit WHERE id = ?')
      .get(id);
    return NextResponse.json(row, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PUT(req) {
  try {
    const db = await init();
    const url = new URL(req.url);
    const id = url.searchParams.get('id');
    if (!id) {
      return NextResponse.json({ error: 'id required' }, { status: 422 });
    }

    const current = db
      .prepare('SELECT id, nama_kategori FROM kategori_benefit WHERE id = ?')
      .get(id);
    if (!current) {
      return NextResponse.json({ error: 'Kategori benefit tidak ditemukan' }, { status: 404 });
    }

    const body = await req.json();
    if (!body || !Object.prototype.hasOwnProperty.call(body, 'nama_kategori')) {
      return NextResponse.json({ error: 'nama_kategori required' }, { status: 422 });
    }

    const nama_kategori = String(body.nama_kategori || '').trim();
    if (!nama_kategori) {
      return NextResponse.json({ error: 'nama_kategori required' }, { status: 422 });
    }

    const duplicate = db
      .prepare('SELECT id FROM kategori_benefit WHERE lower(nama_kategori) = lower(?) AND id != ?')
      .get(nama_kategori, id);
    if (duplicate) {
      return NextResponse.json({ error: 'Kategori benefit sudah ada' }, { status: 409 });
    }

    db.prepare('UPDATE kategori_benefit SET nama_kategori = ? WHERE id = ?').run(nama_kategori, id);

    const row = db
      .prepare('SELECT id, nama_kategori FROM kategori_benefit WHERE id = ?')
      .get(id);
    return NextResponse.json(row, { status: 200 });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(req) {
  try {
    const db = await init();
    const url = new URL(req.url);
    const id = url.searchParams.get('id');
    if (!id) {
      return NextResponse.json({ error: 'id required' }, { status: 422 });
    }

    const existing = db
      .prepare('SELECT id FROM kategori_benefit WHERE id = ?')
      .get(id);
    if (!existing) {
      return NextResponse.json({ error: 'Kategori benefit tidak ditemukan' }, { status: 404 });
    }

    db.prepare('DELETE FROM kategori_benefit WHERE id = ?').run(id);
    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
