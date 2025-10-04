
const fs = require('fs');
const path = require('path');

const DB_DIR = path.join(__dirname, 'database');
const DB_FILE = path.join(DB_DIR, 'app.db');

function exitWith(msg, code = 1) {
	console.error(msg);
	process.exit(code);
}

// Ensure database directory exists
try {
	if (!fs.existsSync(DB_DIR)) {
		fs.mkdirSync(DB_DIR, { recursive: true });
		console.log('Created directory:', DB_DIR);
	} else {
		console.log('Directory exists:', DB_DIR);
	}
} catch (err) {
	exitWith('Failed to create database directory: ' + err.message);
}

// Ensure media directory inside database exists (for uploaded/managed media files)
const MEDIA_DIR = path.join(DB_DIR, 'media');
try {
	if (!fs.existsSync(MEDIA_DIR)) {
		fs.mkdirSync(MEDIA_DIR, { recursive: true });
		console.log('Created media directory:', MEDIA_DIR);
	} else {
		console.log('Media directory exists:', MEDIA_DIR);
	}
} catch (err) {
	exitWith('Failed to create media directory: ' + err.message);
}

// Try to load better-sqlite3 (fast, synchronous); if missing, instruct user how to install
let Database;
try {
	Database = require('better-sqlite3');
} catch (err) {
	console.error('Package "better-sqlite3" not found.');
	console.log('\nInstall it with one of the following commands (PowerShell / npm):');
	console.log('  npm install better-sqlite3 --save');
	console.log('\nOr use yarn:');
	console.log('  yarn add better-sqlite3');
	console.log('\nAfter installing, rerun: node setup.js');
	process.exit(2);
}

// Open (or create) database
let db;
try {
	// avoid verbose native logs; keep console output concise
	db = new Database(DB_FILE);
	console.log(`Opened SQLite database at ${DB_FILE}`);
} catch (err) {
	exitWith('Failed to open database: ' + err.message);
}

// Apply pragmatic optimizations (safe defaults)
try {
	// Use WAL for better concurrency and performance
	const wal = db.pragma('journal_mode = WAL');
	console.log('journal_mode ->', wal);

	// Moderate synchronous for better speed while keeping reasonable durability
	db.pragma('synchronous = NORMAL');

	// Keep temporary tables in memory
	db.pragma('temp_store = MEMORY');

	// Enable foreign keys
	db.pragma('foreign_keys = ON');

	// Increase cache size (negative value uses KB, here ~20MB)
	try {
		db.pragma('cache_size = -20000');
	} catch (e) {
		// Some SQLite builds may not accept very large cache sizes; ignore safely
	}

	// Optionally set mmap_size if supported (improves I/O on modern builds)
	try {
		db.pragma('mmap_size = 3000000000');
	} catch (e) {
		// ignore if unsupported
	}

	console.log('Applied PRAGMA optimizations');
} catch (err) {
	console.warn('Failed to apply some PRAGMA settings:', err.message);
}

// Create tables: users, benefit, product
try {
	const createSql = `
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
	`;

	db.exec(createSql);
	console.log('Ensured tables: users, benefit, kategori_produk, produk, produk_benefit, media (and indexes)');
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
		{ nama: 'Dekorasi & Akad', sub: null },
		{ nama: 'Prewedding', sub: null },
		{ nama: 'Wedding', sub: null },
		{ nama: 'Khitan/Rasul', sub: null },
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