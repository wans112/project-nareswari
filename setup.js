
const fs = require('fs');
const path = require('path');

const DB_DIR = path.join(__dirname, 'database');
const DB_FILE = path.join(DB_DIR, 'app.db');

function exitWith(msg, code = 1) {
	console.error(msg);
	process.exit(code);
}

function ensureDir(dir) {
	try {
		if (!fs.existsSync(dir)) {
			fs.mkdirSync(dir, { recursive: true });
			console.log('Created directory:', dir);
		} else {
			console.log('Directory exists:', dir);
		}
	} catch (err) {
		exitWith('Failed to create directory ' + dir + ': ' + err.message);
	}
}

// Ensure database and media directories
ensureDir(DB_DIR);
const MEDIA_DIR = path.join(DB_DIR, 'media');
ensureDir(MEDIA_DIR);

// Load better-sqlite3 and open DB
let Database;
try {
	Database = require('better-sqlite3');
} catch (err) {
	console.error('Package "better-sqlite3" not found.');
	console.log('\nInstall it with: npm install better-sqlite3 --save');
	process.exit(2);
}

let db;
try {
	db = new Database(DB_FILE);
	console.log(`Opened SQLite database at ${DB_FILE}`);
} catch (err) {
	exitWith('Failed to open database: ' + err.message);
}

// Apply pragmatic PRAGMA settings (grouped and tolerant)
try {
	const pragmas = [
		['journal_mode', 'WAL'],
		['synchronous', 'NORMAL'],
		['temp_store', 'MEMORY'],
		['foreign_keys', 'ON'],
		['cache_size', '-20000'],
		['mmap_size', '3000000000'],
	];

	for (const [k, v] of pragmas) {
		try {
			const res = db.pragma(`${k} = ${v}`);
			if (k === 'journal_mode') console.log('journal_mode ->', res);
		} catch (e) {
			// ignore unsupported pragmas
		}
	}
	console.log('Applied PRAGMA optimizations');
} catch (err) {
	console.warn('Failed to apply some PRAGMA settings:', err.message);
}

// Create tables: users, benefit, product, etc. Wrapped in a transaction for safety
try {
	const createSql = `
		BEGIN;

		CREATE TABLE IF NOT EXISTS users (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			name TEXT,
			username TEXT NOT NULL UNIQUE,
			password TEXT,
			created_at DATETIME DEFAULT CURRENT_TIMESTAMP
		);

		CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);

		CREATE TABLE IF NOT EXISTS kategori_benefit (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			nama_kategori TEXT NOT NULL,
			created_at DATETIME DEFAULT CURRENT_TIMESTAMP
		);

		CREATE TABLE IF NOT EXISTS benefit (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			benefit TEXT NOT NULL,
			kategori_benefit_id INTEGER NOT NULL,
			created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
			FOREIGN KEY (kategori_benefit_id) REFERENCES kategori_benefit(id) ON DELETE CASCADE
		);

		CREATE TABLE IF NOT EXISTS kategori_produk (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			nama_kategori TEXT NOT NULL,
			sub_kategori TEXT,
			created_at DATETIME DEFAULT CURRENT_TIMESTAMP
		);

		CREATE TABLE IF NOT EXISTS produk (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			kategori_produk_id INTEGER NOT NULL,
			nama_paket TEXT NOT NULL,
			harga INTEGER,
			created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
			FOREIGN KEY (kategori_produk_id) REFERENCES kategori_produk(id) ON DELETE CASCADE
		);

		CREATE INDEX IF NOT EXISTS idx_produk_kategori ON produk(kategori_produk_id);

		CREATE TABLE IF NOT EXISTS produk_benefit (
			produk_id INTEGER NOT NULL,
			benefit_id INTEGER NOT NULL,
			created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
			PRIMARY KEY (produk_id, benefit_id),
			FOREIGN KEY (produk_id) REFERENCES produk(id) ON DELETE CASCADE,
			FOREIGN KEY (benefit_id) REFERENCES benefit(id) ON DELETE CASCADE
		);

		CREATE INDEX IF NOT EXISTS idx_produk_benefit_produk ON produk_benefit(produk_id);
		CREATE INDEX IF NOT EXISTS idx_produk_benefit_benefit ON produk_benefit(benefit_id);

		CREATE TABLE IF NOT EXISTS media (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			produk_id INTEGER,
			media_path TEXT NOT NULL,
			created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
			FOREIGN KEY (produk_id) REFERENCES produk(id) ON DELETE CASCADE
		);

		CREATE INDEX IF NOT EXISTS idx_media_produk ON media(produk_id);

		CREATE TABLE IF NOT EXISTS diskon (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			nama_diskon TEXT NOT NULL,
			produk_id INTEGER NOT NULL,
			deskripsi TEXT,
			persentase INTEGER,
			nominal INTEGER,
			aktif INTEGER DEFAULT 1,
			mulai DATETIME,
			berakhir DATETIME,
			created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
			FOREIGN KEY (produk_id) REFERENCES produk(id) ON DELETE CASCADE
		);

		CREATE INDEX IF NOT EXISTS idx_diskon_produk ON diskon(produk_id);

		CREATE TABLE IF NOT EXISTS page_views (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			path TEXT NOT NULL,
			hostname TEXT,
			referrer TEXT,
			user_agent TEXT,
			ip TEXT,
			lang TEXT,
			created_at DATETIME DEFAULT CURRENT_TIMESTAMP
		);

		CREATE INDEX IF NOT EXISTS idx_page_views_path ON page_views(path);
		CREATE INDEX IF NOT EXISTS idx_page_views_created ON page_views(created_at);

		COMMIT;
	`;

	db.exec(createSql);
	console.log('Ensured tables: users, benefit, kategori_produk, produk, produk_benefit, media, diskon (and indexes)');
} catch (err) {
	exitWith('Failed to create tables: ' + err.message);
}

// Seed kategori_produk (idempotent)
try {
	// ensure uniqueness to avoid duplicate seeds
	db.exec('CREATE UNIQUE INDEX IF NOT EXISTS idx_kategori_unique ON kategori_produk(nama_kategori, sub_kategori);');

	const categories = [
		{ nama: 'Pernikahan', sub: 'Rumah' },
		{ nama: 'Pernikahan', sub: 'Gedung' },
		{ nama: 'Akad', sub: null },
		{ nama: 'Prewedding', sub: null },
		{ nama: 'Wedding', sub: null },
		{ nama: 'Khitan/Rasul', sub: null },
		{ nama: 'Makeup & Hairstyling', sub: null },
		{ nama: 'Sewa Kebaya & Busana', sub: null },
	];

	const insert = db.prepare('INSERT OR IGNORE INTO kategori_produk (nama_kategori, sub_kategori) VALUES (?, ?)');
	const insertMany = db.transaction((items) => {
		for (const it of items) insert.run(it.nama, it.sub);
	});

	insertMany(categories);
	console.log('Seeded kategori_produk (idempotent)');
} catch (err) {
	console.warn('Seeding kategori_produk failed:', err.message);
}

// Seed kategori_benefit (idempotent)
try {
	db.exec('CREATE UNIQUE INDEX IF NOT EXISTS idx_kategori_benefit_unique ON kategori_benefit(nama_kategori);');
	const benefitCategories = [
		{ nama: 'Makeup & Busana' },
		{ nama: 'Dekorasi & Perlengkapan' },
		{ nama: 'Dokumentasi' },
		{ nama: 'Entertainment' }
	];
	const insKb = db.prepare('INSERT OR IGNORE INTO kategori_benefit (nama_kategori) VALUES (?)');
	const insManyKb = db.transaction((items) => {
		for (const it of items) insKb.run(it.nama);
	});
	insManyKb(benefitCategories);
	console.log('Seeded kategori_benefit (idempotent)');
} catch (err) {
	console.warn('Seeding kategori_benefit failed:', err.message);
}

// Vacuum + analyze to finalize
try {
	db.exec('ANALYZE;');
	// Do not run VACUUM automatically on large DBs; leaving optional
	console.log('ANALYZE executed');
} catch (err) {
	console.warn('ANALYZE failed:', err.message);
}

db.close();
console.log('Database setup complete.');