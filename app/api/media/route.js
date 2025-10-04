import { NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs';
import { init } from '@/lib/db';

const MEDIA_DIR = path.join(process.cwd(), 'database', 'media');

function ensureMediaDir() {
	if (!fs.existsSync(MEDIA_DIR)) fs.mkdirSync(MEDIA_DIR, { recursive: true });
}

function guessContentType(filePath) {
	const ext = path.extname(filePath).toLowerCase();
	if (ext === '.jpg' || ext === '.jpeg') return 'image/jpeg';
	if (ext === '.png') return 'image/png';
	if (ext === '.webp') return 'image/webp';
	if (ext === '.gif') return 'image/gif';
	return 'application/octet-stream';
}

export async function GET(req) {
	try {
		const db = await init();
		const url = new URL(req.url);
		const file = url.searchParams.get('file');
		const id = url.searchParams.get('id');
		const produk_id = url.searchParams.get('produk_id');

		if (file) {
			// stream file by relative path
			const abs = path.join(MEDIA_DIR, path.basename(file));
			if (!fs.existsSync(abs)) return NextResponse.json({ error: 'Not found' }, { status: 404 });
			const data = await fs.promises.readFile(abs);
			return new Response(data, { headers: { 'Content-Type': guessContentType(abs), 'Cache-Control': 'public, max-age=31536000, immutable' } });
		}

		if (id) {
			const row = db.prepare('SELECT * FROM media WHERE id = ?').get(id);
			if (!row) return NextResponse.json({ error: 'Not found' }, { status: 404 });
			const urlPath = `/api/media?file=${encodeURIComponent(row.media_path)}`;
			return NextResponse.json({ ...row, url: urlPath }, { status: 200 });
		}

		let rows = [];
		if (produk_id) {
			rows = db.prepare('SELECT * FROM media WHERE produk_id = ? ORDER BY id DESC').all(produk_id);
		} else {
			rows = db.prepare('SELECT * FROM media ORDER BY id DESC').all();
		}
		const out = rows.map(r => ({ ...r, url: `/api/media?file=${encodeURIComponent(r.media_path)}` }));
		return NextResponse.json(out, { status: 200 });
	} catch (err) {
		return NextResponse.json({ error: err.message }, { status: 500 });
	}
}

export async function POST(req) {
	try {
		const db = await init();
		ensureMediaDir();
		const form = await req.formData();
		const file = form.get('file');
		const produk_id = form.get('produk_id');
		if (!file || typeof file === 'string') return NextResponse.json({ error: 'file required' }, { status: 422 });
		const original = file.name || 'upload';
		const ext = path.extname(original) || '.bin';
		const safeBase = path.basename(original, ext).replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 40) || 'file';
		const unique = `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
		const fname = `${safeBase}_${unique}${ext}`;
		const abs = path.join(MEDIA_DIR, fname);
		const arrayBuffer = await file.arrayBuffer();
		const buffer = Buffer.from(arrayBuffer);
		await fs.promises.writeFile(abs, buffer);

		const info = db.prepare('INSERT INTO media (produk_id, media_path) VALUES (?, ?)').run(produk_id ? Number(produk_id) : null, fname);
		const id = info.lastInsertROWID || info.lastInsertRowid || info.lastInsertId;
		return NextResponse.json({ id, produk_id: produk_id ? Number(produk_id) : null, media_path: fname, url: `/api/media?file=${encodeURIComponent(fname)}` }, { status: 201 });
	} catch (err) {
		return NextResponse.json({ error: err.message }, { status: 500 });
	}
}

export async function PUT(req) {
	try {
		const db = await init();
		ensureMediaDir();
		const url = new URL(req.url);
		const id = url.searchParams.get('id');
		if (!id) return NextResponse.json({ error: 'id query required' }, { status: 422 });

		const form = await req.formData();
		const file = form.get('file');
		const produk_id = form.get('produk_id');

		// fetch existing
		const existing = db.prepare('SELECT * FROM media WHERE id = ?').get(id);
		if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 });

		let media_path = existing.media_path;
		if (file && typeof file !== 'string') {
			// save new file and remove old
			const original = file.name || 'upload';
			const ext = path.extname(original) || '.bin';
			const safeBase = path.basename(original, ext).replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 40) || 'file';
			const unique = `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
			const fname = `${safeBase}_${unique}${ext}`;
			const abs = path.join(MEDIA_DIR, fname);
			const arrayBuffer = await file.arrayBuffer();
			const buffer = Buffer.from(arrayBuffer);
			await fs.promises.writeFile(abs, buffer);
			// delete old file
			try { await fs.promises.unlink(path.join(MEDIA_DIR, existing.media_path)); } catch {}
			media_path = fname;
		}

		const parts = [];
		const params = [];
		if (produk_id !== null && produk_id !== undefined) { parts.push('produk_id = ?'); params.push(produk_id ? Number(produk_id) : null); }
		if (media_path !== existing.media_path) { parts.push('media_path = ?'); params.push(media_path); }
		if (parts.length) {
			params.push(id);
			db.prepare(`UPDATE media SET ${parts.join(', ')} WHERE id = ?`).run(...params);
		}
		const updated = db.prepare('SELECT * FROM media WHERE id = ?').get(id);
		return NextResponse.json({ ...updated, url: `/api/media?file=${encodeURIComponent(updated.media_path)}` }, { status: 200 });
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
		const existing = db.prepare('SELECT * FROM media WHERE id = ?').get(id);
		if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 });
		db.prepare('DELETE FROM media WHERE id = ?').run(id);
		try { await fs.promises.unlink(path.join(MEDIA_DIR, existing.media_path)); } catch {}
		return NextResponse.json({ ok: true }, { status: 200 });
	} catch (err) {
		return NextResponse.json({ error: err.message }, { status: 500 });
	}
}

