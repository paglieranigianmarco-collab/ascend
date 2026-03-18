const Database = require('better-sqlite3');
const path = require('path');

// Railway mounts persistent volumes at /data; fallback to project root locally
const DB_PATH = process.env.RAILWAY_VOLUME_MOUNT_PATH
  ? path.join(process.env.RAILWAY_VOLUME_MOUNT_PATH, 'theladder.db')
  : path.join(__dirname, '..', 'theladder.db');
const db = new Database(DB_PATH);

db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

function init() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS income (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      date TEXT NOT NULL,
      amount REAL NOT NULL,
      gross_amount REAL,
      source TEXT NOT NULL DEFAULT 'freelance',
      description TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS expenses (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      date TEXT NOT NULL,
      amount REAL NOT NULL,
      category TEXT NOT NULL,
      description TEXT,
      recurring INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS tax_payments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      period TEXT NOT NULL,
      period_label TEXT NOT NULL,
      due_date TEXT NOT NULL,
      estimated_amount REAL DEFAULT 0,
      billed_amount REAL DEFAULT 0,
      paid_amount REAL DEFAULT 0,
      status TEXT DEFAULT 'estimated',
      notes TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS loans (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      bank TEXT NOT NULL,
      original_amount REAL NOT NULL,
      current_balance REAL NOT NULL,
      interest_rate REAL NOT NULL DEFAULT 0,
      monthly_payment REAL NOT NULL,
      start_date TEXT,
      notes TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS loan_payments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      loan_id INTEGER NOT NULL REFERENCES loans(id) ON DELETE CASCADE,
      date TEXT NOT NULL,
      amount REAL NOT NULL,
      extra_amount REAL DEFAULT 0,
      note TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS investments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      type TEXT NOT NULL,
      symbol TEXT NOT NULL,
      name TEXT NOT NULL,
      quantity REAL DEFAULT 0,
      avg_buy_price REAL DEFAULT 0,
      current_price REAL DEFAULT 0,
      platform TEXT,
      wallet_address TEXT,
      notes TEXT,
      updated_at TEXT DEFAULT (datetime('now')),
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS cash_accounts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      balance REAL NOT NULL DEFAULT 0,
      currency TEXT DEFAULT 'EUR',
      notes TEXT,
      updated_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL,
      updated_at TEXT DEFAULT (datetime('now'))
    );
  `);

  // Seed default tax periods if empty
  const taxCount = db.prepare('SELECT COUNT(*) as c FROM tax_payments').get();
  if (taxCount.c === 0) {
    const insertTax = db.prepare(`
      INSERT INTO tax_payments (period, period_label, due_date, estimated_amount, status)
      VALUES (?, ?, ?, 0, 'estimated')
    `);
    const periods = [
      ['Q1_2025', '1st Advance (Q1)', '2025-06-30'],
      ['Q2_2025', '2nd Advance (Q2)', '2025-11-30'],
      ['Q3_2026', '1st Advance (Q1)', '2026-06-30'],
      ['Q4_2026', '2nd Advance (Q2)', '2026-11-30'],
      ['ANNUAL_2025', 'Annual Settlement 2025', '2026-06-30'],
    ];
    for (const [period, label, due] of periods) {
      insertTax.run(period, label, due);
    }
  }

  // Seed default settings
  const settingsCount = db.prepare('SELECT COUNT(*) as c FROM settings').get();
  if (settingsCount.c === 0) {
    const insertSetting = db.prepare('INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)');
    insertSetting.run('tax_rate', '23');
    insertSetting.run('currency', 'EUR');
    insertSetting.run('tax_buffer_percent', '30');
  }

  console.log('✅ Database initialized at', DB_PATH);
}

module.exports = { db, init };
