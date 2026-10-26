# GoldPriceLK Backend

Lightweight Express + TypeScript API foundation using SQLite. Includes database initialization, health checks, centralized 404/error handling, and graceful shutdown.

## Requirements

- Node.js 20 or newer recommended
- npm

## Setup

```bash
npm install
npm run dev
```

The local server listens on `http://127.0.0.1:3000` by default.

## Endpoints

- `GET /api` — API information
- `GET /api/health` — general health information
- `GET /api/health/live` — process liveness
- `GET /api/health/ready` — database readiness

## Verify

```bash
npm run typecheck
npm run build
curl http://127.0.0.1:3000/api/health
curl http://127.0.0.1:3000/api/health/ready
```

## Notes

- CBSL collectors and price API routes are not implemented yet.
- Keep `.env` and database files out of version control.
- Configure `HOST`, `FRONTEND_ORIGIN`, and persistent database storage appropriately in production.
- Back up the SQLite database file regularly. For a consistent backup while the app is running, use SQLite's backup API or a suitable backup procedure rather than blindly copying only the main file while WAL mode is active.
