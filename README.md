# QELMORA — Luxury E-Commerce

Full-stack fashion store with React (Vite), Express, MySQL, Cloudinary, COD, and Razorpay.

## Structure

```
crm/
  frontend/     # React + Tailwind + TanStack Query
  backend/      # Express REST API
  database/     # MySQL schema & seeds
  README.md
```

## Prerequisites

- Node.js 20+
- MySQL 8+
- Cloudinary account (product images / banners)
- Razorpay account (optional, for online payments)

## 1. Database

```bash
mysql -u root -p < database/001_schema.sql
mysql -u root -p < database/002_seed.sql
```

## 2. Backend

```bash
cd backend
cp .env.example .env
# Edit MySQL, JWT, Cloudinary, Razorpay, BOOTSTRAP_SECRET
npm install
npm run dev
```

Bootstrap the single admin (one-time):

```bash
curl -X POST http://localhost:5000/api/v1/auth/bootstrap-admin \
  -H "Content-Type: application/json" \
  -H "x-bootstrap-secret: YOUR_BOOTSTRAP_SECRET" \
  -d "{\"name\":\"Admin\",\"email\":\"admin@qelmora.com\",\"password\":\"ChangeMe12345\"}"
```

Remove or rotate `BOOTSTRAP_SECRET` after bootstrap in production.

## 3. Frontend

```bash
cd frontend
cp .env.example .env
npm install
npm run dev
```

Open http://localhost:5173

## Admin workflow

1. Sign in as admin → `/admin`
2. Add homepage banners (hero loads on homepage)
3. Create products with Cloudinary uploads and variants
4. Customers register, shop, checkout with COD or Razorpay

## API health

`GET http://localhost:5000/api/v1/health`

## Security notes

- JWT protects cart, checkout, account, and all admin routes
- Razorpay signatures are verified on the server — never trust client payment status
- Cloudinary API secret stays on the backend; uploads use signed requests
- No public admin registration

## Legacy schema

The root `schema.sql` is an older snapshot. Prefer `database/001_schema.sql` for new installs.
