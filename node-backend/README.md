# Node API (Lab 8)

This folder contains the comparative Node.js/Express backend for Lab 8.

## Scope implemented
- Entities: Event, Participant, Registration
- CRUD routes for all entities
- PostgreSQL connection and automatic schema initialization
- Basic middleware:
  - request logging (`morgan`)
  - centralized error handling
  - 404 handler

## Environment
Copy `.env.example` to `.env` and set values:

```bash
PORT=3000
NODE_ENV=development
INIT_DB=true
DATABASE_URL=postgres://postgres:postgres@localhost:5432/lab8_events
```

## Install and run

```bash
cd node-api
npm install
npm run dev
```

If the database does not exist yet, create it first:

```bash
createdb -U postgres lab8_events
```

Health endpoint:
- `GET /health`

API endpoints:
- `GET|POST /api/events`
- `GET|PUT|PATCH|DELETE /api/events/:id`
- `GET|POST /api/participants`
- `GET|PUT|PATCH|DELETE /api/participants/:id`
- `GET|POST /api/registrations`
- `GET|PUT|PATCH|DELETE /api/registrations/:id`

## Notes
- Schema is initialized at startup when `INIT_DB=true`.
- Registration table enforces unique `(participant_id, event_id)` and foreign-key constraints.
- Participant email is unique.
