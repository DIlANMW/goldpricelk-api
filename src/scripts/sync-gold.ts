import { fetchGoldPrices } from '../collectors/gold.collector.js';
import { saveGoldPrices } from '../services/gold.service.js';
import db from '../config/database.js';

function formatDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

async function main(): Promise<void> {
  const endDate = new Date();
  const startDate = new Date(endDate);

  // Import approximately one year of historical gold prices.
  startDate.setUTCDate(startDate.getUTCDate() - 364);

  const from = formatDate(startDate);
  const to = formatDate(endDate);

  console.log('GoldPriceLK historical gold-price import');
  console.log(`Date range: ${from} to ${to}`);

  const records = await fetchGoldPrices(from, to);

  console.log(`Fetched ${records.length} records from CBSL.`);

  const savedCount = saveGoldPrices(records);

  console.log(`Saved ${savedCount} records to SQLite.`);
  console.log('Import completed successfully.');
}

main()
  .catch((error: unknown) => {
    console.error('Gold-price import failed:');

    if (error instanceof Error) {
      console.error(error.message);
      console.error(error.stack);
    } else {
      console.error(error);
    }

    process.exitCode = 1;
  })
  .finally(() => {
    db.close();
  });
