import Database from "better-sqlite3";
import fs from "node:fs";
import path from "node:path";
import { env } from "./env.js";

fs.mkdirSync(path.dirname(env.databasePath), { recursive: true });

const db = new Database(env.databasePath);
db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");
db.pragma("busy_timeout = 5000");

db.exec(`
  CREATE TABLE IF NOT EXISTS gold_prices (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    price_date TEXT NOT NULL,
    price_per_troy_ounce NUMERIC NOT NULL CHECK (price_per_troy_ounce > 0),
    source TEXT NOT NULL DEFAULT 'CBSL',
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (price_date, source)
  );

  CREATE INDEX IF NOT EXISTS idx_gold_prices_date
    ON gold_prices (price_date);

  CREATE TABLE IF NOT EXISTS exchange_rates (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    rate_date TEXT NOT NULL,
    currency_code TEXT NOT NULL,
    rate_type TEXT NOT NULL,
    rate_value NUMERIC NOT NULL CHECK (rate_value > 0),
    source TEXT NOT NULL DEFAULT 'CBSL',
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (rate_date, currency_code, rate_type, source)
  );

  CREATE INDEX IF NOT EXISTS idx_exchange_rates_lookup
    ON exchange_rates (currency_code, rate_type, rate_date);

  CREATE TABLE IF NOT EXISTS data_sync_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    data_type TEXT NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('success', 'failed')),
    records_processed INTEGER NOT NULL DEFAULT 0,
    error_message TEXT,
    started_at TEXT NOT NULL,
    completed_at TEXT
  );
`);

export function checkDatabase(): void {
  db.prepare("SELECT 1").get();
}

export default db;
