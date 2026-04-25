# FinPlan

FinPlan is a small full-stack financial planning app built as a single monorepo with a clear split between the Angular frontend and the NestJS backend.

## Stack

- Frontend: Angular 21
- Backend: Node.js 24 LTS + NestJS + TypeScript
- Database: PostgreSQL 18
- ORM: Prisma
- Containers: Podman Compose or Docker Compose for local development, plus a production-oriented compose file for later deployment in Portainer

## Features

- Overview table with 5 columns:
  - Date
  - Income
  - Expense
  - Cash Balance
  - Text
- Year filter for the overview table
  - Defaults to the current year
  - Year choices are derived from the years found in existing booking dates
  - Cash balance is still calculated from the full chronological booking history and does not reset per year
- New booking form with validation
- Edit existing bookings from the UI
- Delete existing bookings from the UI
- Exactly one of income or expense must be provided
- Cash balance computed on the backend as a running total in chronological order
- PostgreSQL check constraints to enforce the income/expense rule and positive amounts
- Prisma migration included in the repo

## Folder structure

```text
finplan/
├── backend/
├── frontend/
├── compose.yml
├── compose.prod.yml
└── README.md
```

## Quick start for local development

1. Copy the example environment file if you want custom database credentials:

   ```bash
   cp .env.example .env
   ```

2. Start the stack with Docker Compose:

   ```bash
   docker compose up --build
   ```

   Or with Podman Compose:

   ```bash
   podman compose up --build
   ```

3. Open the app:

   - Frontend: http://localhost:4200
   - Backend API: http://localhost:3000/api
   - Health endpoint: http://localhost:3000/api/health

On the first run, the frontend and backend containers install npm dependencies into container volumes and then start the dev servers.

## Reset the local database

Docker Compose:

```bash
docker compose down -v
```

Podman Compose:

```bash
podman compose down -v
```

## Production-style stack for later Portainer use

This repo also includes `compose.prod.yml`.

Docker Compose:

```bash
docker compose -f compose.prod.yml up --build -d
```

Podman Compose:

```bash
podman compose -f compose.prod.yml up --build -d
```

That production compose file:

- builds the backend into a compiled NestJS image
- builds the Angular frontend and serves it with Nginx
- keeps PostgreSQL data in a named volume
- exposes the frontend on port `8080`

## API summary

### `GET /api/bookings`

Returns all bookings ordered by booking date and creation time, with a computed `cashBalance` field.

The backend always computes `cashBalance` from the full chronological list. The frontend year filter only hides or shows rows in the UI; it does not change the all-time running balance calculation.

### `POST /api/bookings`

Example request body:

```json
{
  "bookingDate": "2026-04-03",
  "income": 2500,
  "text": "Salary April"
}
```

or

```json
{
  "bookingDate": "2026-04-04",
  "expense": 89.4,
  "text": "Groceries"
}
```

### `PATCH /api/bookings/:id`

Updates an existing booking. The user can change the booking date, switch between income and expense, change the amount, change the text, or make several of those changes at once.

Example request body:

```json
{
  "bookingDate": "2026-05-01",
  "expense": 42.5,
  "text": "Train ticket"
}
```

### `DELETE /api/bookings/:id`

Deletes an existing booking.

## Notes

- The frontend talks to the backend through `/api` so that the same relative API path works both in local development and in the future production-style Nginx setup.
- The backend computes the running cash balance instead of storing it as an editable field. This keeps back-dated inserts, edits, and deletes simple and correct.
- The overview year filter is intentionally implemented in the frontend after loading all bookings, so the row-level cash balances remain the all-time balances returned by the backend.
- The database schema includes check constraints so the important business rule is enforced even if another client writes directly to the database.
- The Angular dev setup clears local Vite/Angular cache on container startup to avoid stale optimized dependency errors after rebuilds.
