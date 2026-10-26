import { Router } from 'express';
import {
  getLatestGoldPrice,
  getGoldPriceHistory,
} from '../services/gold.service.js';

const router = Router();

function isValidDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }

  const date = new Date(`${value}T00:00:00Z`);

  return (
    !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value
  );
}

router.get('/latest', (_req, res) => {
  const record = getLatestGoldPrice();

  if (!record) {
    res.status(404).json({
      error: {
        code: 'GOLD_PRICE_NOT_FOUND',
        message: 'No gold-price data is available yet.',
      },
    });
    return;
  }

  res.json({ data: record });
});

router.get('/history', (req, res) => {
  const from = String(req.query.from ?? '');
  const to = String(req.query.to ?? '');

  if (!isValidDate(from) || !isValidDate(to) || from > to) {
    res.status(400).json({
      error: {
        code: 'INVALID_DATE_RANGE',
        message: 'Provide valid from and to dates in YYYY-MM-DD format.',
      },
    });
    return;
  }

  const records = getGoldPriceHistory(from, to);

  res.json({
    data: records,
    meta: {
      from,
      to,
      count: records.length,
    },
  });
});

export default router;
