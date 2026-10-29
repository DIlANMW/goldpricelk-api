import axios from 'axios';
import { wrapper } from 'axios-cookiejar-support';
import { CookieJar } from 'tough-cookie';
import * as cheerio from 'cheerio';
import fs from 'node:fs';
import path from 'node:path';

export interface GoldPriceRecord {
  date: string;
  pricePerTroyOunce: number;
}

const SELECTION_URL =
  'https://www.cbsl.gov.lk/cbsl_custom/exrates/exratesgold.php';

const RESULTS_URL =
  'https://www.cbsl.gov.lk/cbsl_custom/exrates/exrates_results.php';

function validateDate(date: string, name: string): void {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    throw new Error(`${name} must use YYYY-MM-DD format.`);
  }

  const parsed = new Date(`${date}T00:00:00Z`);

  if (
    Number.isNaN(parsed.getTime()) ||
    parsed.toISOString().slice(0, 10) !== date
  ) {
    throw new Error(`${name} is not a valid date.`);
  }
}

function normalizeDate(value: string): string | null {
  const cleaned = value.trim();

  if (/^\d{4}-\d{2}-\d{2}$/.test(cleaned)) {
    const parsed = new Date(`${cleaned}T00:00:00Z`);

    return !Number.isNaN(parsed.getTime()) &&
      parsed.toISOString().slice(0, 10) === cleaned
      ? cleaned
      : null;
  }

  const match = cleaned.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/);

  if (!match) return null;

  const [, day, month, year] = match;
  const normalized = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;

  const parsed = new Date(`${normalized}T00:00:00Z`);

  return !Number.isNaN(parsed.getTime()) &&
    parsed.toISOString().slice(0, 10) === normalized
    ? normalized
    : null;
}

function parseNumber(value: string): number | null {
  const parsed = Number(value.replace(/,/g, '').trim());

  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

function parseGoldPriceHtml(
  html: string,
  startDate: string,
  endDate: string,
): GoldPriceRecord[] {
  const $ = cheerio.load(html);
  const records = new Map<string, GoldPriceRecord>();

  $('table').each((_index, table) => {
    const $table = $(table);

    const headers = $table
      .find('thead th')
      .map((_i, element) => $(element).text().trim().toLowerCase())
      .get();

    const headerText = headers.join(' ');

    if (
      !headerText.includes('date') ||
      !headerText.includes('xau') ||
      !headerText.includes('lkr')
    ) {
      return;
    }

    $table.find('tbody tr').each((_rowIndex, row) => {
      const cells = $(row).find('td');

      if (cells.length < 2) return;

      const date = normalizeDate($(cells[0]).text());
      const price = parseNumber($(cells[1]).text());

      if (!date || price === null) return;
      if (date < startDate || date > endDate) return;

      records.set(date, {
        date,
        pricePerTroyOunce: price,
      });
    });
  });

  return Array.from(records.values()).sort((a, b) =>
    a.date.localeCompare(b.date),
  );
}

export async function fetchGoldPrices(
  startDate: string,
  endDate: string,
): Promise<GoldPriceRecord[]> {
  validateDate(startDate, 'startDate');
  validateDate(endDate, 'endDate');

  if (startDate > endDate) {
    throw new Error('startDate must be earlier than or equal to endDate.');
  }

  const normalizedStartDate = startDate;
  const normalizedEndDate = endDate;

  const jar = new CookieJar();

  const client = wrapper(
    axios.create({
      jar,
      timeout: 60000,
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/155.0.0.0 Safari/537.36',
      },
    }),
  );

  console.log('Opening CBSL gold selection page...');

  await client.get(SELECTION_URL);

  console.log('CBSL selection page opened.');

  const body = new URLSearchParams({
    lookupPage: 'lookup_daily_exchange_rates.php',
    startRange: '2006-11-11',
    rangeType: 'dates',
    txtStart: normalizedStartDate,
    txtEnd: normalizedEndDate,
    'chk_cur[]': 'XAU~Gold (per Troy oz.)',
    submit_button: 'Submit',
  });

  console.log(
    `Requesting CBSL gold prices from ${normalizedStartDate} to ${normalizedEndDate}...`,
  );

  const response = await client.post(RESULTS_URL, body.toString(), {
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Referer: SELECTION_URL,
      Origin: 'https://www.cbsl.gov.lk',
    },
  });

  const html = response.data as string;

  console.log('CBSL status:', response.status);
  console.log('CBSL response length:', html.length);
  console.log('Gold table found:', html.includes('Gold (per Troy oz.)'));

  const debugPath = path.resolve(
    process.cwd(),
    'data',
    'cbsl-debug-response.html',
  );

  fs.mkdirSync(path.dirname(debugPath), { recursive: true });
  fs.writeFileSync(debugPath, html, 'utf8');

  const records = parseGoldPriceHtml(
    html,
    normalizedStartDate,
    normalizedEndDate,
  );

  console.log(`Parsed gold-price records: ${records.length}`);

  if (records.length === 0) {
    throw new Error(
      `No gold-price records returned by CBSL. Inspect ${debugPath}`,
    );
  }

  return records;
}
