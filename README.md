# EarthGuard

EarthGuard is a sustainability-focused web application with a marketing landing page and a backend with database-backed records for:

- User accounts
- Customer information
- Orders and payments
- Messages
- Products and services

The project includes a production-ready starter structure for a Node.js + PostgreSQL backend and a static frontend.

## Features

- Landing page for EarthGuard
- Theme switcher
- Sustainability tips modal
- Progress tracker and chart
- User authentication with JWT
- PostgreSQL schema for all major tables
- Ownership-aware API design
- Demo mode fallback when no database is configured

## Project structure

- `index.html` — landing page
- `styles.css` — site styling
- `app.js` — frontend interactions
- `chart.js` — chart rendering logic
- `server.js` — Express API server
- `db/schema.sql` — database schema
- `db/init.js` — initializes the PostgreSQL schema
- `.env.example` — environment configuration template

## Local setup

1. Install dependencies:

   ```bash
   npm install
   ```

2. Create a `.env` file:

   ```bash
   cp .env.example .env
   ```

3. Configure your PostgreSQL connection string in `.env`.

4. Initialize the database schema:

   ```bash
   npm run db:init
   ```

5. Start the app:

   ```bash
   npm start
   ```

6. Open:

   ```text
   http://localhost:3000
   ```

## Environment variables

- `PORT` — app port, default `3000`
- `JWT_SECRET` — secure secret for login tokens
- `DATABASE_URL` — PostgreSQL connection string

## Example `.env`

```env
PORT=3000
JWT_SECRET=supersecretjwtkey
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/earthguard
```

## Demo mode

If `DATABASE_URL` is not configured, the backend falls back to an in-memory data store so the app can still run locally for demonstration.

## API endpoints

- `GET /api/health`
- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/users/me`
- `GET /api/customers`
- `GET /api/products`
- `GET /api/services`
- `GET /api/orders`
- `POST /api/orders`
- `GET /api/messages`
- `POST /api/messages`
- `GET /api/payments`
- `POST /api/payments`
- `GET /api/dashboard`

## Production deployment

- Frontend: Vercel or Netlify
- Backend: Render, Railway, or Fly.io
- Database: Supabase, Neon, or managed PostgreSQL

## License

MIT
