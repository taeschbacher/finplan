# FinPlan

FinPlan is a small full-stack financial planning app built as a single monorepo with a clear split between the Angular frontend and the NestJS backend.

## Stack

- Frontend: Angular 21
- Backend: Node.js 24 LTS + NestJS + TypeScript
- Database: PostgreSQL 18
- ORM: Prisma
- Containers: Podman Compose for local development, plus a production-oriented compose file for later deployment in Portainer

## Features in this starter

- Overview table with 5 columns:
  - Date
  - Income
  - Expense
  - Cash Balance
  - Text
- New booking form with validation
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

2. Start the stack:

   ```bash
   podman compose up --build
   ```

3. Open the app:

   - Frontend: http://localhost:4200
   - Backend API: http://localhost:3000/api
   - Health endpoint: http://localhost:3000/api/health

On the first run, the frontend and backend containers install npm dependencies into container volumes and then start the dev servers.

## Reset the local database

```bash
podman compose down -v
```

## Production-style stack for later Portainer use

This repo also includes `compose.prod.yml`.

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

### `DELETE /api/bookings/:id`

Included as a useful development endpoint, though the first UI version does not expose a delete button.

## Notes

- The frontend talks to the backend through `/api` so that the same relative API path works both in local development and in the future production-style Nginx setup.
- The backend computes the running cash balance instead of storing it as an editable field. This keeps back-dated inserts simple and correct.
- The database schema includes check constraints so the important business rule is enforced even if another client writes directly to the database.
