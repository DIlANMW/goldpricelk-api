import cron from 'node-cron';
import { fetchGoldPrices } from '../collectors/gold.collector.js';
import { saveGoldPrices } from '../services/gold.service.js';

const TIMEZONE = 'Asia/Colombo';

// Prevent concurrent runs if a previous CBSL request takes too long.
let isRunning = false;

function formatDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

export async function runGoldPriceSync(): Promise<void> {
  if (isRunning) {
    console.warn('[Gold sync] Previous sync is still running. Skipping.');
    return;
  }

  isRunning = true;

  try {
    // Use the Sri Lankan calendar date, not the server's local timezone.
    const now = new Date();
    const sriLankaDate = new Date(
      now.toLocaleString('en-US', { timeZone: TIMEZONE }),
    );

    const endDate = formatDate(sriLankaDate);
    const start = new Date(sriLankaDate);
    start.setDate(start.getDate() - 6);

    const startDate = formatDate(start);

    console.info(
      `[Gold sync] Starting CBSL sync for ${startDate} to ${endDate}`,
    );

    const records = await fetchGoldPrices(startDate, endDate);

    if (records.length === 0) {
      console.warn('[Gold sync] CBSL returned no records. Nothing saved.');
      return;
    }

    const savedCount = saveGoldPrices(records);

    console.info(
      `[Gold sync] Completed successfully. Fetched ${records.length}; saved ${savedCount} records.`,
    );
  } catch (error) {
    console.error('[Gold sync] Synchronization failed.');

    if (error instanceof Error) {
      console.error(error.message);
    } else {
      console.error(error);
    }

    // Do not terminate the API process because CBSL is temporarily unavailable.
  } finally {
    isRunning = false;
  }
}

export function startGoldPriceScheduler(): void {
  // 18:30 Monday-Friday, Sri Lanka time.
  cron.schedule(
    '30 18 * * 1-5',
    () => {
      void runGoldPriceSync();
    },
    { timezone: TIMEZONE },
  );

  console.info(
    '[Gold sync] Scheduler registered: Monday-Friday at 18:30 Asia/Colombo.',
  );
}
