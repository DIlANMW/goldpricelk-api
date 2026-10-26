import db, { checkDatabase } from '../config/database.js';

try {
  checkDatabase();

  const tables = db
    .prepare(
      `
      SELECT name
      FROM sqlite_master
      WHERE type = 'table'
      AND name NOT LIKE 'sqlite_%'
      ORDER BY name
    `,
    )
    .all() as Array<{ name: string }>;

  console.log('Database connection: OK');
  console.log('Database tables:');

  for (const table of tables) {
    console.log(`- ${table.name}`);
  }

  const goldCount = db
    .prepare('SELECT COUNT(*) AS count FROM gold_prices')
    .get() as { count: number };

  const exchangeCount = db
    .prepare('SELECT COUNT(*) AS count FROM exchange_rates')
    .get() as { count: number };

  console.log('Gold records:', goldCount.count);
  console.log('Exchange-rate records:', exchangeCount.count);
} catch (error) {
  console.error('Database test failed:', error);
  process.exitCode = 1;
} finally {
  db.close();
}
