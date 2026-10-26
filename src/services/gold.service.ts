import db from '../config/database.js';
import type { GoldPriceRecord } from '../collectors/gold.collector.js';

const upsertGoldPrice = db.prepare(`
  INSERT INTO gold_prices (
    price_date,
    price_per_troy_ounce,
    source,
    updated_at
  )
  VALUES (?, ?, 'CBSL', CURRENT_TIMESTAMP)
  ON CONFLICT (price_date, source)
  DO UPDATE SET
    price_per_troy_ounce = excluded.price_per_troy_ounce,
    updated_at = CURRENT_TIMESTAMP
`);

const saveGoldPricesTransaction = db.transaction(
  (records: GoldPriceRecord[]) => {
    for (const record of records) {
      upsertGoldPrice.run(record.date, record.pricePerTroyOunce);
    }
  },
);

export function saveGoldPrices(records: GoldPriceRecord[]): number {
  if (records.length === 0) {
    throw new Error('No valid gold-price records to save.');
  }

  for (const record of records) {
    if (
      !/^\d{4}-\d{2}-\d{2}$/.test(record.date) ||
      !Number.isFinite(record.pricePerTroyOunce) ||
      record.pricePerTroyOunce <= 0
    ) {
      throw new Error('Invalid gold-price record.');
    }
  }

  saveGoldPricesTransaction(records);

  return records.length;
}

export function getLatestGoldPrice() {
  return db
    .prepare(
      `
      SELECT price_date, price_per_troy_ounce, source
      FROM gold_prices
      ORDER BY price_date DESC
      LIMIT 1
    `,
    )
    .get();
}

export function getGoldPriceHistory(from: string, to: string) {
  return db
    .prepare(
      `
      SELECT price_date, price_per_troy_ounce, source
      FROM gold_prices
      WHERE price_date >= ? AND price_date <= ?
      ORDER BY price_date ASC
    `,
    )
    .all(from, to);
}
