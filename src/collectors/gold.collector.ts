import * as cheerio from 'cheerio';

export interface GoldPriceRecord {
  date: string;
  pricePerTroyOunce: number;
}

function normalizeDate(value: string): string | null {
  const trimmed = value.trim();

  if (!/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    return null;
  }

  const parsed = new Date(`${trimmed}T00:00:00Z`);

  if (
    Number.isNaN(parsed.getTime()) ||
    parsed.toISOString().slice(0, 10) !== trimmed
  ) {
    return null;
  }

  return trimmed;
}

function parseNumber(value: string): number | null {
  const normalized = value.replace(/,/g, '').trim();

  if (!/^\d+(?:\.\d+)?$/.test(normalized)) {
    return null;
  }

  const number = Number(normalized);

  return Number.isFinite(number) && number > 0 ? number : null;
}

export function parseGoldPriceHtml(html: string): GoldPriceRecord[] {
  const $ = cheerio.load(html);
  const records: GoldPriceRecord[] = [];

  for (const table of $('table').toArray()) {
    const rows = $(table).find('tr').toArray();

    if (rows.length < 2) {
      continue;
    }

    const headers = $(rows[0])
      .find('th, td')
      .toArray()
      .map((cell) => $(cell).text().replace(/\s+/g, ' ').trim().toLowerCase());

    const dateIndex = headers.findIndex((header) => header.includes('date'));

    const priceIndex = headers.findIndex(
      (header) => header.includes('xau') && header.includes('lkr'),
    );

    if (dateIndex === -1 || priceIndex === -1) {
      continue;
    }

    for (const row of rows.slice(1)) {
      const cells = $(row)
        .find('td')
        .toArray()
        .map((cell) => $(cell).text().replace(/\s+/g, ' ').trim());

      const date = normalizeDate(cells[dateIndex] ?? '');
      const price = parseNumber(cells[priceIndex] ?? '');

      if (date && price !== null) {
        records.push({
          date,
          pricePerTroyOunce: price,
        });
      }
    }
  }

  const uniqueRecords = new Map<string, GoldPriceRecord>();

  for (const record of records) {
    uniqueRecords.set(record.date, record);
  }

  return [...uniqueRecords.values()].sort((a, b) =>
    a.date.localeCompare(b.date),
  );
}
