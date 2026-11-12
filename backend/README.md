# QELMORA API

Express REST API under `/api/v1`.

## Scripts

- `npm run dev` — nodemon
- `npm start` — production

## Environment

Copy `.env.example` to `.env`. Required: `JWT_ACCESS_SECRET`, MySQL vars.

Optional: Cloudinary (media), Razorpay (online pay), `BOOTSTRAP_SECRET` (one-time admin).

## Key routes

| Area | Prefix |
|------|--------|
| Auth | `/auth` |
| Products | `/products` |
| Categories | `/categories` |
| Cart | `/cart` |
| Orders | `/orders` |
| Addresses | `/addresses` |
| Payments | `/payments` |
| Admin analytics | `/admin` |
| Banners | `/banners` |
| Coupons | `/coupons` |
