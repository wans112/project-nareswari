import { NextResponse } from 'next/server';
import { init } from '@/lib/db';

function normalizeKategoriCode(code, nama, sub) {
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

function normalizeKategoriDescription(desc, nama, sub) {
	const base = desc ? String(desc).trim() : '';
	if (base) return base;
	const joined = [nama, sub].filter(Boolean).join(' — ');
	return joined || (nama || 'Kategori');
}

function getInsertId(info) {
	return info.lastInsertROWID || info.lastInsertRowid || info.lastInsertId;
}

function ensureCategoryId(db, { kategori_produk_id, nama_kategori, sub_kategori, code_kategori, deskripsi_kategori }) {
	if (kategori_produk_id) return kategori_produk_id;
	const nama = nama_kategori ? String(nama_kategori).trim() : '';
	if (!nama) throw new Error('nama_kategori required');
	const sub = sub_kategori ? String(sub_kategori).trim() : '';
	const subValue = sub || null;
	const code = normalizeKategoriCode(code_kategori, nama, subValue);
	const description = normalizeKategoriDescription(deskripsi_kategori, nama, subValue);

	const byCode = db.prepare('SELECT id FROM kategori_produk WHERE lower(code_kategori) = lower(?)').get(code);
	if (byCode) return byCode.id;

	const sel = db.prepare('SELECT id, code_kategori, deskripsi_kategori FROM kategori_produk WHERE nama_kategori = ? AND (sub_kategori IS ? OR sub_kategori = ?)').get(nama, subValue, subValue);
	if (sel) {
		if (sel.code_kategori !== code || sel.deskripsi_kategori !== description) {
			db.prepare('UPDATE kategori_produk SET code_kategori = ?, deskripsi_kategori = ? WHERE id = ?').run(code, description, sel.id);
		}
		return sel.id;
	}

	const info = db.prepare('INSERT INTO kategori_produk (nama_kategori, sub_kategori, code_kategori, deskripsi_kategori) VALUES (?, ?, ?, ?)').run(nama, subValue, code, description);
	return getInsertId(info);
}

function ensureDefaultKategoriBenefitId(db) {
	// pick any existing kategori_benefit or create 'Umum'
	const any = db.prepare('SELECT id FROM kategori_benefit LIMIT 1').get();
	if (any) return any.id;
	const ins = db.prepare('INSERT INTO kategori_benefit (nama_kategori) VALUES (?)').run('Umum');
	return ins.lastInsertROWID || ins.lastInsertRowid || ins.lastInsertId;
}

async function ensureBenefitIds(db, benefits = []) {
	const ids = [];
	const sel = db.prepare('SELECT id FROM benefit WHERE benefit = ?');
	const ins = db.prepare('INSERT OR IGNORE INTO benefit (benefit, kategori_benefit_id) VALUES (?, ?)');
	const defaultKbId = ensureDefaultKategoriBenefitId(db);
	for (const b of benefits) {
		if (b == null || b === '') continue;
		if (typeof b === 'number') { ids.push(b); continue; }
		// attempt to find existing first
		const existing = sel.get(b);
		if (existing) { ids.push(existing.id); continue; }
		ins.run(b, defaultKbId);
		const row = sel.get(b);
		if (row) ids.push(row.id);
	}
	return ids;
}

function upsertCoverMedia(db, produkId, mediaId) {
	if (mediaId == null) {
		db.prepare('DELETE FROM cover_media WHERE produk_id = ?').run(produkId);
		return null;
	}
	const target = db.prepare('SELECT id FROM media WHERE id = ? AND produk_id = ?').get(mediaId, produkId);
	if (!target) throw new Error('cover_media_id invalid for produk');
	db.prepare('INSERT INTO cover_media (produk_id, media_id) VALUES (?, ?) ON CONFLICT(produk_id) DO UPDATE SET media_id = excluded.media_id').run(produkId, mediaId);
	return mediaId;
}

function ensureCoverMedia(db, produkId) {
	const current = db.prepare('SELECT media_id FROM cover_media WHERE produk_id = ?').get(produkId);
	if (current) return current.media_id;
	const fallback = db.prepare('SELECT id FROM media WHERE produk_id = ? ORDER BY id DESC LIMIT 1').get(produkId);
	if (fallback) {
		db.prepare('INSERT INTO cover_media (produk_id, media_id) VALUES (?, ?)').run(produkId, fallback.id);
		return fallback.id;
	}
	db.prepare('DELETE FROM cover_media WHERE produk_id = ?').run(produkId);
	return null;
}

function coverUrlFromPath(path) {
	return path ? `/api/media?file=${encodeURIComponent(path)}` : null;
}

export async function GET(req) {
	try {
		const db = await init();
		const url = new URL(req.url);
		const id = url.searchParams.get('id');
		const meta = url.searchParams.get('meta');

		if (meta) {
			const categories = db.prepare('SELECT id, nama_kategori, sub_kategori, code_kategori, deskripsi_kategori FROM kategori_produk ORDER BY nama_kategori, sub_kategori').all();
			// include kategori_benefit name so frontend can build kategori select
			const benefits = db.prepare(`
				SELECT b.id, b.benefit, kb.nama_kategori
				FROM benefit b
				LEFT JOIN kategori_benefit kb ON kb.id = b.kategori_benefit_id
				ORDER BY b.benefit
			`).all();
			return NextResponse.json({ categories, benefits }, { status: 200 });
		}

		if (id) {
			const row = db.prepare(
				`SELECT p.*, kp.nama_kategori, kp.sub_kategori, kp.code_kategori, kp.deskripsi_kategori,
					cm.media_id AS cover_media_id,
					mcover.media_path AS cover_media_path
				 FROM produk p
				 JOIN kategori_produk kp ON kp.id = p.kategori_produk_id
				 LEFT JOIN cover_media cm ON cm.produk_id = p.id
				 LEFT JOIN media mcover ON mcover.id = cm.media_id
				 WHERE p.id = ?`
			).get(id);
			if (!row) return NextResponse.json({ error: 'Not found' }, { status: 404 });
			const bens = db.prepare('SELECT b.benefit FROM benefit b JOIN produk_benefit pb ON pb.benefit_id = b.id WHERE pb.produk_id = ?').all(id);
			row.benefits = bens.map(x => x.benefit);
			row.cover_url = coverUrlFromPath(row.cover_media_path);
			return NextResponse.json(row, { status: 200 });
		}

		const rows = db.prepare(
			`SELECT p.*, kp.nama_kategori, kp.sub_kategori, kp.code_kategori, kp.deskripsi_kategori,
				cm.media_id AS cover_media_id,
				mcover.media_path AS cover_media_path,
				group_concat(b.benefit) AS benefits
			 FROM produk p
			 JOIN kategori_produk kp ON kp.id = p.kategori_produk_id
			 LEFT JOIN cover_media cm ON cm.produk_id = p.id
			 LEFT JOIN media mcover ON mcover.id = cm.media_id
			 LEFT JOIN produk_benefit pb ON pb.produk_id = p.id
			 LEFT JOIN benefit b ON b.id = pb.benefit_id
			 GROUP BY p.id
			 ORDER BY p.id DESC`
		).all();
		const out = rows.map(r => ({
			...r,
			benefits: r.benefits ? String(r.benefits).split(',') : [],
			cover_url: coverUrlFromPath(r.cover_media_path)
		}));
		return NextResponse.json(out, { status: 200 });
	} catch (err) {
		return NextResponse.json({ error: err.message }, { status: 500 });
	}
}

export async function POST(req) {
	try {
		const db = await init();
		const body = await req.json();
		const { nama_paket, harga = null, kategori_produk_id, nama_kategori, sub_kategori = null, code_kategori, deskripsi_kategori, benefits = [], media_ids = [], cover_media_id } = body;
		if (!nama_paket) return NextResponse.json({ error: 'nama_paket required' }, { status: 422 });

		const catId = ensureCategoryId(db, { kategori_produk_id, nama_kategori, sub_kategori, code_kategori, deskripsi_kategori });
		const insProd = db.prepare('INSERT INTO produk (kategori_produk_id, nama_paket, harga) VALUES (?, ?, ?)');
		const insPB = db.prepare('INSERT OR IGNORE INTO produk_benefit (produk_id, benefit_id) VALUES (?, ?)');
		const tx = db.transaction((kategoriId, payload, benefitIds) => {
			const info = insProd.run(kategoriId, payload.nama_paket, payload.harga);
			const pid = info.lastInsertROWID || info.lastInsertRowid || info.lastInsertId;
			for (const bid of benefitIds) insPB.run(pid, bid);
			return pid;
		});

		const bIds = await ensureBenefitIds(db, benefits);
		const newId = tx(catId, { nama_paket, harga }, bIds);

		// associate any provided media ids with this new product
		if (Array.isArray(media_ids) && media_ids.length > 0) {
			const upd = db.prepare('UPDATE media SET produk_id = ? WHERE id = ?');
			const txm = db.transaction((pid, ids) => {
				for (const mid of ids) upd.run(pid, mid);
			});
			txm(newId, media_ids);
		}

		const coverProvided = Object.prototype.hasOwnProperty.call(body, 'cover_media_id');
		if (coverProvided) {
			if (cover_media_id === null || cover_media_id === '') {
				upsertCoverMedia(db, newId, null);
			} else {
				const parsed = Number(cover_media_id);
				if (!Number.isFinite(parsed)) return NextResponse.json({ error: 'cover_media_id invalid' }, { status: 422 });
				try {
					upsertCoverMedia(db, newId, parsed);
				} catch (error) {
					if (error?.message?.includes('cover_media_id')) {
						return NextResponse.json({ error: 'cover_media_id invalid' }, { status: 422 });
					}
					throw error;
				}
			}
		} else if (Array.isArray(media_ids) && media_ids.length > 0) {
			ensureCoverMedia(db, newId);
		}
		const created = db.prepare('SELECT * FROM produk WHERE id = ?').get(newId);
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
		if (!id) return NextResponse.json({ error: 'id query required' }, { status: 422 });

		const body = await req.json();
		const { nama_paket, harga, kategori_produk_id, nama_kategori, sub_kategori, code_kategori, deskripsi_kategori, benefits, media_ids = [], removed_media_ids = [], cover_media_id } = body;

		if (nama_paket !== undefined || harga !== undefined || kategori_produk_id !== undefined || nama_kategori !== undefined) {
			const parts = [];
			const params = [];
			if (nama_paket !== undefined) { parts.push('nama_paket = ?'); params.push(nama_paket); }
			if (harga !== undefined) { parts.push('harga = ?'); params.push(harga); }
			if (kategori_produk_id !== undefined || nama_kategori !== undefined) {
				const catId = ensureCategoryId(db, { kategori_produk_id, nama_kategori, sub_kategori: sub_kategori ?? null, code_kategori, deskripsi_kategori });
				parts.push('kategori_produk_id = ?'); params.push(catId);
			}
			params.push(id);
			db.prepare(`UPDATE produk SET ${parts.join(', ')} WHERE id = ?`).run(...params);
		}

		if (Array.isArray(benefits)) {
			const bIds = await ensureBenefitIds(db, benefits);
			const del = db.prepare('DELETE FROM produk_benefit WHERE produk_id = ?');
			const ins = db.prepare('INSERT OR IGNORE INTO produk_benefit (produk_id, benefit_id) VALUES (?, ?)');
			const tx = db.transaction((pid, ids) => {
				del.run(pid);
				for (const bid of ids) ins.run(pid, bid);
			});
			tx(id, bIds);
		}

		// associate provided media ids to this product
		if (Array.isArray(media_ids) && media_ids.length > 0) {
			const upd = db.prepare('UPDATE media SET produk_id = ? WHERE id = ?');
			const txm = db.transaction((pid, ids) => {
				for (const mid of ids) upd.run(pid, mid);
			});
			txm(id, media_ids);
		}

		// optionally disassociate media from this product (set produk_id = NULL)
		if (Array.isArray(removed_media_ids) && removed_media_ids.length > 0) {
			const updNull = db.prepare('UPDATE media SET produk_id = NULL WHERE id = ?');
			const txn = db.transaction((ids) => {
				for (const mid of ids) updNull.run(mid);
			});
			txn(removed_media_ids);

			const delCover = db.prepare('DELETE FROM cover_media WHERE produk_id = ? AND media_id = ?');
			const txDelCover = db.transaction((pid, ids) => {
				for (const mid of ids) delCover.run(pid, mid);
			});
			txDelCover(id, removed_media_ids);
		}

		const coverProvided = Object.prototype.hasOwnProperty.call(body, 'cover_media_id');
		if (coverProvided) {
			if (cover_media_id === null || cover_media_id === '') {
				upsertCoverMedia(db, id, null);
			} else {
				const parsed = Number(cover_media_id);
				if (!Number.isFinite(parsed)) return NextResponse.json({ error: 'cover_media_id invalid' }, { status: 422 });
				try {
					upsertCoverMedia(db, id, parsed);
				} catch (error) {
					if (error?.message?.includes('cover_media_id')) {
						return NextResponse.json({ error: 'cover_media_id invalid' }, { status: 422 });
					}
					throw error;
				}
			}
		}

		if (!coverProvided) {
			ensureCoverMedia(db, id);
		}

		const updated = db.prepare('SELECT * FROM produk WHERE id = ?').get(id);
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
		if (!id) return NextResponse.json({ error: 'id query required' }, { status: 422 });
		db.prepare('DELETE FROM produk WHERE id = ?').run(id);
		return NextResponse.json({ ok: true }, { status: 200 });
	} catch (err) {
		return NextResponse.json({ error: err.message }, { status: 500 });
	}
}
