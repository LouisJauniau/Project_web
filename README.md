# EventHub Full Stack Project

## Overview

This repository contains a full stack event management website with three parts:

- `django-backend/`: main backend API (Django + Django REST Framework)
- `frontend/`: web client (React)
- `node-backend/`: comparative backend implementation (Node.js + Express)

The main development flow uses `django-backend` and `frontend` together. The `node-backend` is available for comparison and optional local testing.

## Prerequisites

- Python 3.11+
- Node.js 18+
- npm
- PostgreSQL (only required for `node-backend`; Django can run with SQLite in local dev)

## Local Development Setup

### 1. Configure Django environment

Create `django-backend/.env` from `django-backend/.env.example`.

Required variables for local dev:

- `DEBUG=True` (important for local development)
- `SECRET_KEY`
- `ALLOWED_HOSTS`
- `CORS_ALLOWED_ORIGINS`
- `SUPERADMIN_USERNAME`
- `SUPERADMIN_PASSWORD`

### 2. Run Django backend

```bash
cd django-backend
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver
```

Default local API URL: `http://127.0.0.1:8000/api`

### 3. Run React frontend

```bash
cd frontend
npm install
npm start
```

The frontend uses `REACT_APP_API_BASE_URL` if provided.
If not set, it defaults to `http://127.0.0.1:8000/api`.

### 4. Optional: run Node comparative backend

Create `node-backend/.env` from `node-backend/.env.example`, then run:

```bash
cd node-backend
npm install
npm run dev
```

This backend requires a valid PostgreSQL `DATABASE_URL`.

## Development Notes

- Django backend is the primary backend used by the frontend.
- Frontend and backend should be started in separate terminals.
- Apply migrations after model changes:

```bash
cd django-backend
python manage.py makemigrations
python manage.py migrate
```
