import { NextResponse } from 'next/server';
import { init } from '@/lib/db';

function getInsertId(info) {
  return info.lastInsertROWID || info.lastInsertRowid || info.lastInsertId;
}

function ensureDefaultKategori(db) {
  const any = db.prepare('SELECT id FROM kategori_benefit LIMIT 1').get();
  if (any) return any.id;
  const ins = db.prepare('INSERT INTO kategori_benefit (nama_kategori) VALUES (?)').run('Umum');
  return getInsertId(ins);
}

function migrateBenefitSchemaIfNeeded(db) {
  try {
    const cols = db.prepare("PRAGMA table_info(benefit)").all();
    const hasKategoriCol = cols.some(c => c.name === 'kategori_benefit_id');
    if (!hasKategoriCol) {
      // Old schema: recreate table with new schema and assign default kategori
      const defaultKb = ensureDefaultKategori(db);
      db.transaction(() => {
        db.exec(`ALTER TABLE benefit RENAME TO benefit_old;`);
        db.exec(`CREATE TABLE benefit (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          benefit TEXT NOT NULL,
          kategori_benefit_id INTEGER NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (kategori_benefit_id) REFERENCES kategori_benefit(id) ON DELETE CASCADE
        );`);
        const oldRows = db.prepare('SELECT id, benefit FROM benefit_old').all();
        const ins = db.prepare('INSERT INTO benefit (id, benefit, kategori_benefit_id) VALUES (?, ?, ?)');
        for (const r of oldRows) ins.run(r.id, r.benefit, defaultKb);
        db.exec('DROP TABLE benefit_old;');
      })();
    }
    // Backfill any NULL kategori_benefit_id rows if constraint wasn't enforced previously
    const nullCount = db.prepare('SELECT COUNT(*) as c FROM benefit WHERE kategori_benefit_id IS NULL').get();
    if (nullCount.c > 0) {
      const defaultKb = ensureDefaultKategori(db);
      db.prepare('UPDATE benefit SET kategori_benefit_id = ? WHERE kategori_benefit_id IS NULL').run(defaultKb);
    }
  } catch (e) {
    // swallow migration errors to avoid breaking API; log minimal
    console.warn('Benefit schema migration check failed:', e.message);
  }
}

async function ensureKategoriBenefit(db, { kategori_benefit_id, nama_kategori }) {
  if (kategori_benefit_id) return kategori_benefit_id;
  if (!nama_kategori) return ensureDefaultKategori(db);
  const sel = db.prepare('SELECT id FROM kategori_benefit WHERE nama_kategori = ?').get(nama_kategori);
  if (sel) return sel.id;
  const ins = db.prepare('INSERT INTO kategori_benefit (nama_kategori) VALUES (?)').run(nama_kategori);
  return getInsertId(ins);
}

export async function POST(req) {
  try {
    const db = await init();
    migrateBenefitSchemaIfNeeded(db);
    const body = await req.json();
    const { benefit, kategori_benefit_id, nama_kategori } = body;
    if (!benefit) return NextResponse.json({ error: 'benefit required' }, { status: 422 });
    const kbId = await ensureKategoriBenefit(db, { kategori_benefit_id, nama_kategori });
    const insert = db.prepare('INSERT OR IGNORE INTO benefit (benefit, kategori_benefit_id) VALUES (?, ?)');
    const sel = db.prepare('SELECT id, benefit, kategori_benefit_id FROM benefit WHERE benefit = ?');
    insert.run(benefit, kbId);
    const row = sel.get(benefit);
    const kb = db.prepare('SELECT id, nama_kategori FROM kategori_benefit WHERE id = ?').get(row.kategori_benefit_id);
    return NextResponse.json({ ...row, nama_kategori: kb ? kb.nama_kategori : null }, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function GET(req) {
  try {
    const db = await init();
    migrateBenefitSchemaIfNeeded(db);
    // optional ?kategori=Nama to filter
    const url = new URL(req.url);
    const kat = url.searchParams.get('kategori');
    let rows;
    if (kat) {
      rows = db.prepare('SELECT b.id, b.benefit, b.kategori_benefit_id, kb.nama_kategori FROM benefit b LEFT JOIN kategori_benefit kb ON kb.id = b.kategori_benefit_id WHERE kb.nama_kategori = ? ORDER BY b.benefit').all(kat);
    } else {
      rows = db.prepare('SELECT b.id, b.benefit, b.kategori_benefit_id, kb.nama_kategori FROM benefit b LEFT JOIN kategori_benefit kb ON kb.id = b.kategori_benefit_id ORDER BY b.benefit').all();
    }
    return NextResponse.json(rows, { status: 200 });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PUT(req) {
  try {
    const db = await init();
    migrateBenefitSchemaIfNeeded(db);
    const url = new URL(req.url);
    const id = url.searchParams.get('id');
    const body = await req.json();
    const { benefit, kategori_benefit_id, nama_kategori } = body;
    if (!id) return NextResponse.json({ error: 'id required' }, { status: 422 });
    const parts = [];
    const params = [];
    if (benefit !== undefined) { parts.push('benefit = ?'); params.push(benefit); }
    if (kategori_benefit_id !== undefined || nama_kategori !== undefined) {
      const kbId = await ensureKategoriBenefit(db, { kategori_benefit_id, nama_kategori });
      parts.push('kategori_benefit_id = ?'); params.push(kbId);
    }
    if (parts.length > 0) {
      params.push(id);
      db.prepare(`UPDATE benefit SET ${parts.join(', ')} WHERE id = ?`).run(...params);
    }
    const row = db.prepare('SELECT b.id, b.benefit, b.kategori_benefit_id, kb.nama_kategori FROM benefit b LEFT JOIN kategori_benefit kb ON kb.id = b.kategori_benefit_id WHERE b.id = ?').get(id);
    return NextResponse.json(row, { status: 200 });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(req) {
  try {
    const db = await init();
    migrateBenefitSchemaIfNeeded(db);
    const url = new URL(req.url);
    const id = url.searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'id required' }, { status: 422 });
    db.prepare('DELETE FROM produk_benefit WHERE benefit_id = ?').run(id);
    db.prepare('DELETE FROM benefit WHERE id = ?').run(id);
    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
