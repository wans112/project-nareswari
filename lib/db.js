import fs from "fs";
import path from "path";
import Database from "better-sqlite3";

const DEFAULT_DB_PATH = path.join(process.cwd(), "database", "app.db");
let db = null;

/**
 * Inisialisasi koneksi SQLite (better-sqlite3).
 * - Membuat folder jika belum ada
 * - Membuka file DB (synchronous)
 * - Menjalankan PRAGMA optimasi (WAL, foreign_keys, busy_timeout, dll)
 * @param {string} [dbPath]
 * @returns {Promise<Database>}
 */
export function init(dbPath = DEFAULT_DB_PATH) {
  if (db) return Promise.resolve(db);

  const dir = path.dirname(dbPath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

  try {
    // open DB (will create file if not exists)
    // set a busy timeout to avoid immediate "database is locked" errors
    db = new Database(dbPath, { timeout: 5000 });

    // Apply recommended PRAGMA settings (idempotent)
    const pragmas = [
      "foreign_keys = ON",
      "journal_mode = WAL",
      "wal_autocheckpoint = 1000",
      "synchronous = NORMAL",
      "temp_store = MEMORY",
      // cache_size negative = KB; larger value for server (~20MB)
      "cache_size = -20000",
      // limit WAL growth (10MB)
      "journal_size_limit = 10485760",
      // mmap_size (may not be supported on all builds)
      "mmap_size = 3000000000",
      // busy timeout in ms
      "busy_timeout = 5000",
    ];

    for (const p of pragmas) {
      try {
        db.pragma(p);
      } catch (e) {
        // ignore unsupported pragmas on some builds
      }
    }

    return Promise.resolve(db);
  } catch (err) {
    db = null;
    return Promise.reject(err);
  }
}

/**
 * Jalankan pernyataan (INSERT/UPDATE/DELETE)
 */
export function run(sql, params = []) {
  return new Promise((resolve, reject) => {
    if (!db) return reject(new Error("Database not initialized. Call init() first."));
    try {
      const stmt = db.prepare(sql);
  const info = stmt.run(...(Array.isArray(params) ? params : [params]));
  // better-sqlite3 returns { changes, lastInsertROWID } on insert; normalize keys
  const lastID = info && (info.lastInsertROWID || info.lastInsertRowid || info.lastInsertId || null);
  resolve({ lastID, changes: info.changes || 0 });
    } catch (err) {
      reject(err);
    }
  });
}

/**
 * Ambil satu baris
 */
export function get(sql, params = []) {
  return new Promise((resolve, reject) => {
    if (!db) return reject(new Error("Database not initialized. Call init() first."));
    try {
      const stmt = db.prepare(sql);
      const row = stmt.get(...(Array.isArray(params) ? params : [params]));
      resolve(row);
    } catch (err) {
      reject(err);
    }
  });
}

/**
 * Ambil semua baris
 */
export function all(sql, params = []) {
  return new Promise((resolve, reject) => {
    if (!db) return reject(new Error("Database not initialized. Call init() first."));
    try {
      const stmt = db.prepare(sql);
      const rows = stmt.all(...(Array.isArray(params) ? params : [params]));
      resolve(rows);
    } catch (err) {
      reject(err);
    }
  });
}

/**
 * Eksekusi beberapa statement (no result)
 */
export function exec(sql) {
  return new Promise((resolve, reject) => {
    if (!db) return reject(new Error("Database not initialized. Call init() first."));
    try {
      db.exec(sql);
      resolve();
    } catch (err) {
      reject(err);
    }
  });
}

/**
 * Optimasi database:
 * - PRAGMA optimize (jika tersedia)
 * - ANALYZE untuk update statistik query planner
 * - VACUUM untuk defragmentasi (opsional, bisa mahal => gunakan secara terjadwal)
 */
export function optimize({ vacuum = false } = {}) {
  return new Promise((resolve, reject) => {
    if (!db) return reject(new Error("Database not initialized. Call init() first."));
    try {
      const steps = ["PRAGMA optimize", "ANALYZE"];
      if (vacuum) steps.push("VACUUM");
      db.exec(steps.join("; "));
      resolve();
    } catch (err) {
      reject(err);
    }
  });
}

/**
 * Tutup koneksi DB
 */
export function close() {
  return new Promise((resolve, reject) => {
    if (!db) return resolve();
    try {
      db.close();
      db = null;
      resolve();
    } catch (err) {
      reject(err);
    }
  });
}