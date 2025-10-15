
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
const BUKTI_DIR = path.join(DB_DIR, 'bukti_transfer');
ensureDir(BUKTI_DIR);

// Ensure config directory and create config.json if not exists
const CONFIG_DIR = path.join(__dirname, 'config');
ensureDir(CONFIG_DIR);
const CONFIG_FILE = path.join(CONFIG_DIR, 'config.json');
if (!fs.existsSync(CONFIG_FILE)) {
	try {
		fs.writeFileSync(CONFIG_FILE, JSON.stringify({}, null, 2));
		console.log('Created config.json:', CONFIG_FILE);
	} catch (err) {
		console.warn('Failed to create config.json:', err.message);
	}
} else {
	console.log('config.json exists:', CONFIG_FILE);
}

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
			code_kategori TEXT NOT NULL,
			nama_kategori TEXT NOT NULL,
			sub_kategori TEXT,
			deskripsi_kategori TEXT NOT NULL,
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

		CREATE TABLE IF NOT EXISTS reviews (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			nama TEXT NOT NULL,
			rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
			isi TEXT NOT NULL,
			href TEXT,
			sumber TEXT,
			created_at DATETIME DEFAULT CURRENT_TIMESTAMP
		);

		CREATE UNIQUE INDEX IF NOT EXISTS idx_reviews_unique ON reviews(nama, isi);
		CREATE INDEX IF NOT EXISTS idx_reviews_rating ON reviews(rating);

		CREATE TABLE IF NOT EXISTS booking (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			produk_id INTEGER,
			nama TEXT NOT NULL,
			email TEXT NOT NULL,
			telepon TEXT NOT NULL,
			tanggal DATE NOT NULL,
			catatan TEXT,
			image_path TEXT,
			status TEXT DEFAULT 'pending',
			created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
			FOREIGN KEY (produk_id) REFERENCES produk(id) ON DELETE SET NULL
		);

		CREATE INDEX IF NOT EXISTS idx_booking_status ON booking(status);
		CREATE INDEX IF NOT EXISTS idx_booking_tanggal ON booking(tanggal);
		CREATE INDEX IF NOT EXISTS idx_booking_produk ON booking(produk_id);

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
	console.log('Ensured tables: users, benefit, kategori_produk, produk, produk_benefit, media, diskon, reviews, booking, page_views (and indexes)');
} catch (err) {
	exitWith('Failed to create tables: ' + err.message);
}

// Add produk_id column to booking table if it doesn't exist (for existing databases)
try {
	const tableInfo = db.prepare("PRAGMA table_info(booking)").all();
	const hasProdukId = tableInfo.some(col => col.name === 'produk_id');
	
	if (!hasProdukId) {
		db.exec('ALTER TABLE booking ADD COLUMN produk_id INTEGER REFERENCES produk(id) ON DELETE SET NULL');
		db.exec('CREATE INDEX IF NOT EXISTS idx_booking_produk ON booking(produk_id)');
		console.log('Added produk_id column to booking table');
	}
} catch (err) {
	console.warn('Failed to add produk_id column:', err.message);
}

// Seed kategori_produk (idempotent)
try {
	// ensure uniqueness to avoid duplicate seeds; include new columns in uniqueness so seeds are stable
	db.exec('CREATE UNIQUE INDEX IF NOT EXISTS idx_kategori_unique ON kategori_produk(nama_kategori, sub_kategori, code_kategori);');

	const categories = [
		{ nama: 'Pernikahan', sub: 'Rumah', code: 'pernikahan', desc: 'Paket pernikahan' },
		{ nama: 'Pernikahan', sub: 'Gedung', code: 'pernikahan', desc: 'Paket pernikahan' },
		{ nama: 'Akad', sub: null, code: 'akad', desc: 'Paket akad nikah' },
		{ nama: 'Prewedding', sub: null, code: 'prewedding', desc: 'Paket foto prewedding' },
		{ nama: 'Wedding', sub: null, code: 'wedding', desc: 'Paket wedding umum' },
		{ nama: 'Khitan/Rasul', sub: null, code: 'khitan', desc: 'Paket khitan/rasul' },
		{ nama: 'Makeup & Hairstyling', sub: null, code: 'makeup', desc: 'Makeup dan hairstyling' },
		{ nama: 'Sewa Kebaya & Busana', sub: null, code: 'sewa', desc: 'Sewa kebaya dan busana' },
	];

	const insert = db.prepare('INSERT OR IGNORE INTO kategori_produk (nama_kategori, sub_kategori, code_kategori, deskripsi_kategori) VALUES (?, ?, ?, ?)');
	const insertMany = db.transaction((items) => {
		for (const it of items) insert.run(it.nama, it.sub, it.code, it.desc);
	});

	insertMany(categories);
	console.log('Seeded kategori_produk');
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
	console.log('Seeded kategori_benefit ');
} catch (err) {
	console.warn('Seeding kategori_benefit failed:', err.message);
}

// Seed reviews (idempotent)
try {
	const reviewSeed = [
		{ nama: 'Chica Rohaetun', rating: 5, isi: 'Suka banget sama pelayananya orang-orangnya juga ramah, hasil make up nya bagus bikin pangling, semoga makin sukses yah kakk', href: 'https://maps.app.goo.gl/ZeaUAk1S4Xs8QYyw9', sumber: 'Google Maps' },
		{ nama: 'Budi Santoso', rating: 4, isi: 'Tim profesional dan ramah - koordinasi mudah. Beberapa detail minor, tapi keseluruhan sangat baik.', href: null, sumber: 'Testimonial' },
		{ nama: 'Ayu Lestari', rating: 5, isi: 'Dekorasi sesuai tema, fotografer juga merekomendasikan tata pencahayaan. Sangat puas!', href: null, sumber: 'Testimonial' },
		{ nama: 'Rudi Wijaya', rating: 4, isi: 'Hasil foto preweddingnya luar biasa, lokasi dan stylingnya pas. Timnya juga sangat profesional.', href: null, sumber: 'Testimonial' },
		{ nama: 'Dewi Kartika', rating: 5, isi: 'Make up natural dan tahan lama, persis seperti yang saya inginkan. Timnya sangat perhatian dan detail.', href: null, sumber: 'Testimonial' },
		{ nama: 'Ahmad Maulana', rating: 4, isi: 'Paket lengkap dengan harga bersaing. Beberapa penyesuaian di hari H, tapi hasil akhirnya memuaskan.', href: null, sumber: 'Testimonial' },
		{ nama: 'Lina Marlina', rating: 5, isi: 'Sangat direkomendasikan untuk dekorasi pernikahan. Timnya kreatif dan sangat membantu dalam proses perencanaan.', href: null, sumber: 'Testimonial' },
	];
	const insReview = db.prepare('INSERT OR IGNORE INTO reviews (nama, rating, isi, href, sumber) VALUES (?, ?, ?, ?, ?)');
	const batchReview = db.transaction((items) => {
		for (const item of items) {
			insReview.run(item.nama, item.rating, item.isi, item.href, item.sumber);
		}
	});
	batchReview(reviewSeed);
	console.log('Seeded reviews');
} catch (err) {
	console.warn('Seeding reviews failed:', err.message);
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