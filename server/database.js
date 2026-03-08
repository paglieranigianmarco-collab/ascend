const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, 'ascend.db');
const db = new Database(dbPath);

// Enable WAL mode for better concurrent performance
db.pragma('journal_mode = WAL');

// ── Create Tables ──────────────────────────────────────────────

db.exec(`
  CREATE TABLE IF NOT EXISTS monthly_income (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    month TEXT NOT NULL,
    gross_amount REAL DEFAULT 0,
    net_amount REAL DEFAULT 0,
    source TEXT DEFAULT '',
    notes TEXT DEFAULT '',
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS taxes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    year INTEGER NOT NULL,
    quarter INTEGER NOT NULL DEFAULT 0,
    type TEXT NOT NULL CHECK(type IN ('quarterly', 'annual')),
    estimated_amount REAL DEFAULT 0,
    billed_amount REAL DEFAULT 0,
    paid_amount REAL DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'Estimated' CHECK(status IN ('Estimated', 'Billed', 'Paid')),
    due_date TEXT,
    paid_date TEXT,
    notes TEXT DEFAULT '',
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS loans (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    total_amount REAL DEFAULT 0,
    remaining_balance REAL DEFAULT 0,
    interest_rate REAL DEFAULT 0,
    base_payment REAL DEFAULT 0,
    extra_payment REAL DEFAULT 0,
    start_date TEXT,
    end_date TEXT,
    notes TEXT DEFAULT '',
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS investments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    type TEXT NOT NULL CHECK(type IN ('crypto', 'stock', 'transfer')),
    name TEXT NOT NULL,
    symbol TEXT DEFAULT '',
    quantity REAL DEFAULT 0,
    purchase_price REAL DEFAULT 0,
    current_value REAL DEFAULT 0,
    platform TEXT DEFAULT '',
    transfer_date TEXT,
    notes TEXT DEFAULT '',
    created_at TEXT DEFAULT (datetime('now'))
  );
`);

module.exports = db;
