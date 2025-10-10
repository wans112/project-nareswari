import { NextResponse } from 'next/server';
import { init } from '@/lib/db';

function getInsertId(info) {
  return info.lastInsertROWID || info.lastInsertRowid || info.lastInsertId;
}

function normalizeCode({ code, nama, sub }) {
  const base = code ? String(code).trim() : '';
  let candidate = base || [nama, sub].filter(Boolean).join(' ');
  candidate = candidate || nama || 'KATEGORI';
  candidate = String(candidate || '').trim();
  const cleaned = candidate
    .toUpperCase()
    .normalize('NFKD')
    .replace(/[^A-Z0-9]+/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '');
  return cleaned || 'KATEGORI';
}

function normalizeDescription(desc, nama, sub) {
  const base = desc ? String(desc).trim() : '';
  if (base) return base;
  const combined = [nama, sub].filter(Boolean).join(' — ');
  return combined || (nama || 'Kategori');
}

export async function POST(req) {
  try {
    const db = await init();
    const body = await req.json();
    const nama_kategori = body?.nama_kategori ? String(body.nama_kategori).trim() : '';
    const subRaw = body?.sub_kategori !== undefined ? String(body.sub_kategori || '').trim() : '';
    const sub_kategori = subRaw ? subRaw : null;
    const code_kategori = normalizeCode({ code: body?.code_kategori, nama: nama_kategori, sub: sub_kategori });
    const deskripsi_kategori = normalizeDescription(body?.deskripsi_kategori, nama_kategori, sub_kategori);

    if (!nama_kategori) {
      return NextResponse.json({ error: 'nama_kategori required' }, { status: 422 });
    }

    const byCode = db
      .prepare('SELECT id, nama_kategori, sub_kategori, code_kategori, deskripsi_kategori FROM kategori_produk WHERE lower(code_kategori) = lower(?)')
      .get(code_kategori);
    if (byCode) {
      return NextResponse.json(byCode, { status: 200 });
    }

    const existing = db
      .prepare(
        `SELECT id, nama_kategori, sub_kategori, code_kategori, deskripsi_kategori
         FROM kategori_produk
         WHERE lower(nama_kategori) = lower(?)
           AND (sub_kategori IS ? OR lower(sub_kategori) = lower(?))`
      )
      .get(nama_kategori, sub_kategori || null, sub_kategori || null);

    if (existing) {
      return NextResponse.json(existing, { status: 200 });
    }

    const info = db
      .prepare(
        'INSERT INTO kategori_produk (nama_kategori, sub_kategori, code_kategori, deskripsi_kategori) VALUES (?, ?, ?, ?)'
      )
      .run(nama_kategori, sub_kategori || null, code_kategori, deskripsi_kategori);
    const id = getInsertId(info);
    const row = db
      .prepare('SELECT id, nama_kategori, sub_kategori, code_kategori, deskripsi_kategori FROM kategori_produk WHERE id = ?')
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
        .prepare('SELECT id, nama_kategori, sub_kategori, code_kategori, deskripsi_kategori FROM kategori_produk WHERE id = ?')
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
          `SELECT id, nama_kategori, sub_kategori, code_kategori, deskripsi_kategori
           FROM kategori_produk
           WHERE lower(nama_kategori) LIKE ?
              OR lower(COALESCE(sub_kategori, '')) LIKE ?
              OR lower(code_kategori) LIKE ?
           ORDER BY nama_kategori, sub_kategori`
        )
        .all(term, term, term);
    } else {
      rows = db
        .prepare('SELECT id, nama_kategori, sub_kategori, code_kategori, deskripsi_kategori FROM kategori_produk ORDER BY nama_kategori, sub_kategori')
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
      .prepare('SELECT id, nama_kategori, sub_kategori, code_kategori, deskripsi_kategori FROM kategori_produk WHERE id = ?')
      .get(id);
    if (!current) {
      return NextResponse.json({ error: 'Kategori tidak ditemukan' }, { status: 404 });
    }

    const body = await req.json();
    const hasNama = Object.prototype.hasOwnProperty.call(body, 'nama_kategori');
    const hasSub = Object.prototype.hasOwnProperty.call(body, 'sub_kategori');
    const hasCode = Object.prototype.hasOwnProperty.call(body, 'code_kategori');
    const hasDesc = Object.prototype.hasOwnProperty.call(body, 'deskripsi_kategori');

    const rawNama = hasNama ? String(body.nama_kategori || '').trim() : undefined;
    const rawSub = hasSub ? String(body.sub_kategori || '').trim() : undefined;
    const rawCode = hasCode ? String(body.code_kategori || '').trim() : undefined;
    const rawDesc = hasDesc ? String(body.deskripsi_kategori || '').trim() : undefined;

    if (rawNama !== undefined && !rawNama) {
      return NextResponse.json({ error: 'nama_kategori required' }, { status: 422 });
    }
    if (rawCode !== undefined && !rawCode) {
      return NextResponse.json({ error: 'code_kategori required' }, { status: 422 });
    }
    if (rawDesc !== undefined && !rawDesc) {
      return NextResponse.json({ error: 'deskripsi_kategori required' }, { status: 422 });
    }

    const finalNama = rawNama !== undefined ? rawNama : current.nama_kategori;
    const finalSub = rawSub !== undefined ? (rawSub ? rawSub : null) : current.sub_kategori;
    const finalCode = hasCode
      ? normalizeCode({ code: rawCode, nama: finalNama, sub: finalSub })
      : current.code_kategori;
    const finalDesc = hasDesc ? normalizeDescription(rawDesc, finalNama, finalSub) : current.deskripsi_kategori;

    const duplicateCode = db
      .prepare('SELECT id FROM kategori_produk WHERE lower(code_kategori) = lower(?) AND id != ?')
      .get(finalCode, id);
    if (duplicateCode) {
      return NextResponse.json({ error: 'code_kategori sudah digunakan' }, { status: 409 });
    }

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
    if (hasNama) {
      parts.push('nama_kategori = ?');
      params.push(finalNama);
    }
    if (hasSub) {
      parts.push('sub_kategori = ?');
      params.push(finalSub || null);
    }
    if (hasCode) {
      parts.push('code_kategori = ?');
      params.push(finalCode);
    }
    if (hasDesc) {
      parts.push('deskripsi_kategori = ?');
      params.push(finalDesc);
    }

    if (parts.length === 0) {
      return NextResponse.json({ error: 'Tidak ada perubahan' }, { status: 422 });
    }

    params.push(id);
    db.prepare(`UPDATE kategori_produk SET ${parts.join(', ')} WHERE id = ?`).run(...params);

    const row = db
      .prepare('SELECT id, nama_kategori, sub_kategori, code_kategori, deskripsi_kategori FROM kategori_produk WHERE id = ?')
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
