import { NextResponse } from 'next/server';
import { init } from '@/lib/db';

function normalizeInsertId(info) {
  return info && (info.lastInsertROWID || info.lastInsertRowid || info.lastInsertId || null);
}

export async function GET(req) {
  try {
    const db = await init();
    const url = new URL(req.url);
    const produk_id = url.searchParams.get('produk_id');
    const includeAll = url.searchParams.get('include_all');

    // Sinkronkan status aktif berdasarkan rentang waktu mulai-berakhir
    try {
      db.prepare(`
        UPDATE diskon
        SET aktif = CASE
          WHEN mulai IS NOT NULL AND datetime('now') < datetime(mulai) THEN 0
          WHEN berakhir IS NOT NULL AND datetime('now') > datetime(berakhir) THEN 0
          ELSE 1
        END
      `).run();
    } catch (e) {
      // abaikan jika fungsi datetime tidak tersedia
    }

    let rows;
    if (produk_id) {
      if (includeAll === '1') {
        rows = db.prepare('SELECT * FROM diskon WHERE produk_id = ? ORDER BY mulai DESC').all(produk_id);
      } else {
        rows = db.prepare('SELECT * FROM diskon WHERE produk_id = ? AND aktif = 1 ORDER BY mulai DESC').all(produk_id);
      }
    } else {
      if (includeAll === '1') {
        rows = db.prepare('SELECT * FROM diskon ORDER BY created_at DESC').all();
      } else {
        rows = db.prepare('SELECT * FROM diskon WHERE aktif = 1 ORDER BY created_at DESC').all();
      }
    }

    return NextResponse.json(rows, { status: 200 });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const db = await init();
    const body = await req.json();

  const nama_diskon = body?.nama_diskon ? String(body.nama_diskon).trim() : '';
  const produk_id = body?.produk_id ? Number(body.produk_id) : null;
  const persentase = body?.persentase != null ? Number(body.persentase) : null;
  const nominal = body?.nominal != null ? Number(body.nominal) : null;
  const deskripsi = body?.deskripsi ? String(body.deskripsi) : null;
  const rawMulai = body?.mulai ? String(body.mulai) : null;
  const rawBerakhir = body?.berakhir ? String(body.berakhir) : null;
  const mulaiDate = rawMulai ? new Date(rawMulai) : null;
  const berakhirDate = rawBerakhir ? new Date(rawBerakhir) : null;
  const mulai = mulaiDate && !Number.isNaN(mulaiDate.getTime()) ? mulaiDate.toISOString() : null;
  const berakhir = berakhirDate && !Number.isNaN(berakhirDate.getTime()) ? berakhirDate.toISOString() : null;

    if (!nama_diskon) return NextResponse.json({ error: 'nama_diskon required' }, { status: 422 });
    if (!produk_id) return NextResponse.json({ error: 'produk_id required' }, { status: 422 });

    // basic validation: persentase 0-100; nominal non-negative
    if (persentase != null && (isNaN(persentase) || persentase < 0 || persentase > 100)) {
      return NextResponse.json({ error: 'persentase invalid' }, { status: 422 });
    }
    if (nominal != null && (isNaN(nominal) || nominal < 0)) {
      return NextResponse.json({ error: 'nominal invalid' }, { status: 422 });
    }

    // determine aktif based on berakhir
    const nowMs = Date.now();
    let aktif = 1;
    if (mulaiDate && !Number.isNaN(mulaiDate.getTime()) && nowMs < mulaiDate.getTime()) {
      aktif = 0;
    }
    if (berakhirDate && !Number.isNaN(berakhirDate.getTime()) && nowMs > berakhirDate.getTime()) {
      aktif = 0;
    }

    const info = db.prepare(
      `INSERT INTO diskon (nama_diskon, produk_id, deskripsi, persentase, nominal, mulai, berakhir, aktif)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
    ).run(nama_diskon, produk_id, deskripsi, persentase, nominal, mulai, berakhir, aktif);

    const id = normalizeInsertId(info);
    const row = db.prepare('SELECT * FROM diskon WHERE id = ?').get(id);
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
    if (!id) return NextResponse.json({ error: 'id required' }, { status: 422 });

    const existing = db.prepare('SELECT * FROM diskon WHERE id = ?').get(id);
    if (!existing) return NextResponse.json({ error: 'Diskon not found' }, { status: 404 });

  const body = await req.json();
  const nama_diskon = body?.nama_diskon ? String(body.nama_diskon).trim() : existing.nama_diskon;
  const produk_id = body?.produk_id != null ? Number(body.produk_id) : existing.produk_id;
  const persentase = body?.persentase != null ? Number(body.persentase) : existing.persentase;
  const nominal = body?.nominal != null ? Number(body.nominal) : existing.nominal;
  const deskripsi = body?.deskripsi != null ? String(body.deskripsi) : existing.deskripsi;

  const hasMulai = Object.prototype.hasOwnProperty.call(body, 'mulai');
  const hasBerakhir = Object.prototype.hasOwnProperty.call(body, 'berakhir');
  const rawMulai = hasMulai ? (body.mulai ? String(body.mulai) : null) : existing.mulai;
  const rawBerakhir = hasBerakhir ? (body.berakhir ? String(body.berakhir) : null) : existing.berakhir;

  const mulaiDate = rawMulai ? new Date(rawMulai) : null;
  const berakhirDate = rawBerakhir ? new Date(rawBerakhir) : null;

  const mulai = mulaiDate && !Number.isNaN(mulaiDate.getTime())
    ? mulaiDate.toISOString()
    : (rawMulai ?? null);

  const berakhir = berakhirDate && !Number.isNaN(berakhirDate.getTime())
    ? berakhirDate.toISOString()
    : (rawBerakhir ?? null);

    const nowMs = Date.now();
    let aktif = 1;
    if (mulaiDate && !Number.isNaN(mulaiDate.getTime()) && nowMs < mulaiDate.getTime()) {
      aktif = 0;
    }
    if (berakhirDate && !Number.isNaN(berakhirDate.getTime()) && nowMs > berakhirDate.getTime()) {
      aktif = 0;
    }

    if (!nama_diskon) return NextResponse.json({ error: 'nama_diskon required' }, { status: 422 });
    if (!produk_id) return NextResponse.json({ error: 'produk_id required' }, { status: 422 });

    db.prepare(
      `UPDATE diskon SET nama_diskon = ?, produk_id = ?, deskripsi = ?, persentase = ?, nominal = ?, mulai = ?, berakhir = ?, aktif = ? WHERE id = ?`
    ).run(nama_diskon, produk_id, deskripsi, persentase, nominal, mulai, berakhir, aktif, id);

    const row = db.prepare('SELECT * FROM diskon WHERE id = ?').get(id);
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
    if (!id) return NextResponse.json({ error: 'id required' }, { status: 422 });

    const existing = db.prepare('SELECT id FROM diskon WHERE id = ?').get(id);
    if (!existing) return NextResponse.json({ error: 'Diskon tidak ditemukan' }, { status: 404 });

    db.prepare('DELETE FROM diskon WHERE id = ?').run(id);
    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
