import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import { pool } from './config/db.js';
import authRoutes from './routes/auth.routes.js';
import productRoutes from './routes/product.routes.js';
import categoryRoutes from './routes/category.routes.js';
import cartRoutes from './routes/cart.routes.js';
import orderRoutes from './routes/order.routes.js';
import addressRoutes from './routes/address.routes.js';
import bannerRoutes from './routes/banner.routes.js';
import couponRoutes from './routes/coupon.routes.js';
import adminRoutes from './routes/admin.routes.js';
import paymentRoutes from './routes/payment.routes.js';
import { applyCloudinaryConfig } from './config/cloudinary.js';
import { cloudinaryConfigured } from './utils/cloudinary-sign.js';
import contentRoutes from './routes/content.routes.js';
import instagramRoutes from './routes/instagram.routes.js';
import { runStartupMigrations } from './utils/ensure-db.js';

applyCloudinaryConfig();

if (!process.env.JWT_ACCESS_SECRET) {
  console.error('JWT_ACCESS_SECRET is required');
  process.exit(1);
}

const app = express();
app.disable('x-powered-by');
app.use(helmet());
app.use(cors({ origin: process.env.CLIENT_ORIGIN?.split(',') || 'http://localhost:5173' }));
app.use(compression());
app.use(express.json({ limit: '2mb' }));

app.use('/api/v1/auth', rateLimit({ windowMs: 15 * 60 * 1000, max: 40 }), authRoutes);
app.use('/api/v1/products', productRoutes);
app.use('/api/v1/categories', categoryRoutes);
app.use('/api/v1/cart', rateLimit({ windowMs: 60 * 1000, max: 120 }), cartRoutes);
app.use('/api/v1/orders', orderRoutes);
app.use('/api/v1/addresses', addressRoutes);
app.use('/api/v1/banners', bannerRoutes);
app.use('/api/v1/content', contentRoutes);
app.use('/api/v1/instagram', instagramRoutes);
app.use('/api/v1/coupons', couponRoutes);
app.use('/api/v1/admin', adminRoutes);
app.use('/api/v1/payments', paymentRoutes);

app.get('/api/v1/health', async (_req, res) => {
  try {
    await pool.query('SELECT 1');
    res.json({ status: 'ok', database: 'connected', brand: 'QELMORA' });
  } catch {
    res.status(503).json({ status: 'degraded', database: 'unavailable' });
  }
});

app.use((err, _req, res, _next) => {
  if (err?.name === 'ZodError') return res.status(400).json({ message: 'Validation failed', errors: err.issues });
  console.error(err);
  res.status(500).json({
    message: process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message,
  });
});

const port = Number(process.env.PORT || 5000);

try {
  await runStartupMigrations();
} catch (e) {
  console.error('Database migration failed:', e.message);
  process.exit(1);
}

app.listen(port, () => {
  console.log(`QELMORA API listening on ${port}`);
  if (!cloudinaryConfigured()) {
    console.warn('Cloudinary: CLOUDINARY_* missing in .env — admin uploads will fail until configured.');
  } else {
    console.log(`Cloudinary: ready (cloud ${process.env.CLOUDINARY_CLOUD_NAME})`);
  }
});
