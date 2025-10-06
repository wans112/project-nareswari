import { NextResponse } from 'next/server';
import { init } from '@/lib/db';

function getInsertId(info) {
  return info.lastInsertROWID || info.lastInsertRowid || info.lastInsertId;
}

export async function POST(req) {
  try {
    const db = await init();
    const body = await req.json();
    const nama_kategori = body?.nama_kategori ? String(body.nama_kategori).trim() : '';
    const sub_kategori = body?.sub_kategori !== undefined ? String(body.sub_kategori || '').trim() : null;

    if (!nama_kategori) {
      return NextResponse.json({ error: 'nama_kategori required' }, { status: 422 });
    }

    const existing = db
      .prepare(
        'SELECT id, nama_kategori, sub_kategori FROM kategori_produk WHERE lower(nama_kategori) = lower(?) AND (sub_kategori IS ? OR lower(sub_kategori) = lower(?))'
      )
      .get(nama_kategori, sub_kategori || null, sub_kategori || null);

    if (existing) {
      return NextResponse.json(existing, { status: 200 });
    }

    const info = db
      .prepare('INSERT INTO kategori_produk (nama_kategori, sub_kategori) VALUES (?, ?)')
      .run(nama_kategori, sub_kategori || null);
    const id = getInsertId(info);
    const row = db
      .prepare('SELECT id, nama_kategori, sub_kategori FROM kategori_produk WHERE id = ?')
      .get(id);

    return NextResponse.json(row, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function GET(req) {
  try {
    const db = await init();
    const url = new URL(req.url);
    const id = url.searchParams.get('id');
    const search = url.searchParams.get('q');

    if (id) {
      const row = db
        .prepare('SELECT id, nama_kategori, sub_kategori FROM kategori_produk WHERE id = ?')
        .get(id);
      if (!row) {
        return NextResponse.json({ error: 'Kategori tidak ditemukan' }, { status: 404 });
      }
      return NextResponse.json(row, { status: 200 });
    }

    let rows;
    if (search) {
      const term = `%${search.toLowerCase()}%`;
      rows = db
        .prepare(
          `SELECT id, nama_kategori, sub_kategori
           FROM kategori_produk
           WHERE lower(nama_kategori) LIKE ?
              OR lower(COALESCE(sub_kategori, '')) LIKE ?
           ORDER BY nama_kategori, sub_kategori`
        )
        .all(term, term);
    } else {
      rows = db
        .prepare('SELECT id, nama_kategori, sub_kategori FROM kategori_produk ORDER BY nama_kategori, sub_kategori')
        .all();
    }

    return NextResponse.json(rows, { status: 200 });
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
      .prepare('SELECT id, nama_kategori, sub_kategori FROM kategori_produk WHERE id = ?')
      .get(id);
    if (!current) {
      return NextResponse.json({ error: 'Kategori tidak ditemukan' }, { status: 404 });
    }

    const body = await req.json();
    let nama = body.hasOwnProperty('nama_kategori') ? String(body.nama_kategori || '').trim() : undefined;
    let sub = body.hasOwnProperty('sub_kategori') ? String(body.sub_kategori || '').trim() : undefined;

    if (nama !== undefined && !nama) {
      return NextResponse.json({ error: 'nama_kategori required' }, { status: 422 });
    }

    const finalNama = nama !== undefined ? nama : current.nama_kategori;
    const finalSub = sub !== undefined ? (sub ? sub : null) : current.sub_kategori;

    const duplicate = db
      .prepare(
        'SELECT id FROM kategori_produk WHERE lower(nama_kategori) = lower(?) AND (sub_kategori IS ? OR lower(sub_kategori) = lower(?)) AND id != ?'
      )
      .get(finalNama, finalSub || null, finalSub || null, id);
    if (duplicate) {
      return NextResponse.json({ error: 'Kategori sudah ada' }, { status: 409 });
    }

    const parts = [];
    const params = [];
    if (nama !== undefined) {
      parts.push('nama_kategori = ?');
      params.push(finalNama);
    }
    if (sub !== undefined) {
      parts.push('sub_kategori = ?');
      params.push(finalSub || null);
    }

    if (parts.length === 0) {
      return NextResponse.json({ error: 'Tidak ada perubahan' }, { status: 422 });
    }

    params.push(id);
    db.prepare(`UPDATE kategori_produk SET ${parts.join(', ')} WHERE id = ?`).run(...params);

    const row = db
      .prepare('SELECT id, nama_kategori, sub_kategori FROM kategori_produk WHERE id = ?')
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
      .prepare('SELECT id FROM kategori_produk WHERE id = ?')
      .get(id);
    if (!existing) {
      return NextResponse.json({ error: 'Kategori tidak ditemukan' }, { status: 404 });
    }

    db.prepare('DELETE FROM kategori_produk WHERE id = ?').run(id);
    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
