# EarthGuard

EarthGuard is a sustainability-focused application with a landing page, authentication, admin dashboard, user customer records, payment and order management, and a PostgreSQL-ready backend.

## Stack

- Frontend: React + Vite
- Backend: Node.js + Express
- Database: PostgreSQL
- Auth: JWT + bcrypt
- Deployment: Vercel for frontend, Render/Railway/Fly for backend

## Architecture

- `server.js` — Express API with auth, dashboard, products, services, orders, payments, messages
- `db/schema.sql` — PostgreSQL schema for all major entities
- `client/` — React app with login, signup, and dashboard pages
- `vercel.json` — config for Vercel deployment
- `render.yaml` — deployment config for Render

## Local development

1. Install backend dependencies:

   ```bash
   npm install
   ```

2. Install client dependencies:

   ```bash
   cd client
   npm install
   ```

3. Configure environment variables:

   ```bash
   cp .env.example .env
   ```

4. Start the backend:

   ```bash
   npm run dev
   ```

5. Start the frontend:

   ```bash
   npm run client:dev
   ```

6. Access:

   - Frontend: http://localhost:5173
   - API: http://localhost:3000

## Demo credentials

- Admin: admin@earthguard.com / admin123
- Customer: customer@earthguard.com / customer123

## Database setup

Use PostgreSQL and set `DATABASE_URL` in `.env`:

```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/earthguard
JWT_SECRET=change-this-secret
PORT=3000
```

Then initialize the schema:

```bash
npm run db:init
```

## Deployment

### Frontend (Vercel)

1. Import the `client/` app into Vercel.
2. Set the environment variable:
   - `VITE_API_URL=https://your-render-url.com`

### Backend (Render)

1. Deploy the repository root as a web service.
2. Set environment variables:
   - `PORT=3000`
   - `JWT_SECRET=...`
   - `DATABASE_URL=...`

## RBAC model

- `admin` — full access to dashboard and records
- `customer` — access to own order, message, and account info

## License

MIT
