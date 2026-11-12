import { Router } from 'express';
import { pool } from '../config/db.js';
import { requireAuth, requireAdmin } from '../middleware/auth.js';
import { cloudinaryConfigErrorResponse, createUploadSignature } from '../utils/cloudinary-sign.js';

const router = Router();

router.get('/', async (req, res, next) => {
  try {
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(48, Math.max(1, Number(req.query.limit) || 12));
    const offset = (page - 1) * limit;
    const search = `%${String(req.query.search || '').slice(0, 80)}%`;
    const categorySlug = req.query.category;
    const featured = req.query.featured === '1';
    const newArrival = req.query.newArrival === '1';

    let where = 'p.is_active=1';
    const params = [];
    if (search !== '%%') {
      where += ' AND p.name LIKE ?';
      params.push(search);
    }
    if (categorySlug) {
      where += ' AND c.slug=?';
      params.push(categorySlug);
    }
    if (featured) where += ' AND p.is_featured=1';
    if (newArrival) where += ' AND p.is_new_arrival=1';

    const [countRows] = await pool.execute(
      `SELECT COUNT(*) AS total FROM products p LEFT JOIN categories c ON c.id=p.category_id WHERE ${where}`,
      params
    );
    const total = Number(countRows[0].total);

    const [items] = await pool.execute(
      `SELECT p.id,p.name,p.slug,p.description,p.price,p.compare_at_price AS compareAtPrice,
        p.is_featured AS isFeatured,p.is_new_arrival AS isNewArrival,
        c.name AS category,c.slug AS categorySlug,
        (SELECT secure_url FROM product_media pm WHERE pm.product_id=p.id AND pm.resource_type='image' ORDER BY sort_order,id LIMIT 1) AS image
       FROM products p LEFT JOIN categories c ON c.id=p.category_id
       WHERE ${where}
       ORDER BY p.is_featured DESC, p.is_new_arrival DESC, p.created_at DESC LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    );
    res.json({ items, page, limit, total, pages: Math.ceil(total / limit) || 1 });
  } catch (e) {
    next(e);
  }
});

router.get('/admin/all', requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const [items] = await pool.execute(
      `SELECT p.id,p.name,p.slug,p.price,p.is_active AS isActive,p.is_featured AS isFeatured,p.is_new_arrival AS isNewArrival,
        c.name AS category,
        (SELECT secure_url FROM product_media pm WHERE pm.product_id=p.id ORDER BY sort_order,id LIMIT 1) AS image
       FROM products p LEFT JOIN categories c ON c.id=p.category_id ORDER BY p.created_at DESC LIMIT 200`
    );
    res.json({ items });
  } catch (e) {
    next(e);
  }
});

router.get('/admin/:id', requireAuth, requireAdmin, async (req, res, next) => {
  try {
    if (req.params.id === 'all') return next();
    const [products] = await pool.execute(`SELECT * FROM products WHERE id=? LIMIT 1`, [req.params.id]);
    if (!products[0]) return res.status(404).json({ message: 'Product not found' });
    const product = products[0];
    const [media] = await pool.execute(
      `SELECT resource_type AS resourceType, secure_url AS secureUrl, public_id AS publicId, alt_text AS altText, sort_order AS sortOrder FROM product_media WHERE product_id=? ORDER BY sort_order`,
      [product.id]
    );
    const [variants] = await pool.execute(
      `SELECT sku, size, color, stock, price_override AS priceOverride FROM product_variants WHERE product_id=?`,
      [product.id]
    );
    res.json({
      ...product,
      compareAtPrice: product.compare_at_price,
      isFeatured: product.is_featured,
      isNewArrival: product.is_new_arrival,
      isActive: product.is_active,
      media,
      variants,
    });
  } catch (e) {
    next(e);
  }
});

router.get('/:slug', async (req, res, next) => {
  try {
    const [products] = await pool.execute(
      `SELECT p.*,c.name AS category,c.slug AS categorySlug FROM products p
       LEFT JOIN categories c ON c.id=p.category_id
       WHERE p.slug=? AND p.is_active=1 LIMIT 1`,
      [req.params.slug]
    );
    if (!products[0]) return res.status(404).json({ message: 'Product not found' });
    const product = products[0];
    const [media] = await pool.execute(
      'SELECT id,resource_type AS resourceType,secure_url AS secureUrl,alt_text AS altText,sort_order AS sortOrder FROM product_media WHERE product_id=? ORDER BY sort_order,id',
      [product.id]
    );
    const [variants] = await pool.execute(
      'SELECT id,sku,size,color,stock,price_override AS priceOverride FROM product_variants WHERE product_id=? ORDER BY size,color',
      [product.id]
    );
    const [related] = await pool.execute(
      `SELECT p.slug,p.name,p.price,p.compare_at_price AS compareAtPrice,
        (SELECT secure_url FROM product_media pm WHERE pm.product_id=p.id ORDER BY sort_order,id LIMIT 1) AS image
       FROM products p WHERE p.is_active=1 AND p.category_id <=> ? AND p.id<>? ORDER BY p.is_featured DESC LIMIT 4`,
      [product.category_id, product.id]
    );
    res.json({
      ...product,
      compareAtPrice: product.compare_at_price,
      isFeatured: product.is_featured,
      isNewArrival: product.is_new_arrival,
      media,
      variants,
      related,
    });
  } catch (e) {
    next(e);
  }
});

router.post('/admin/cloudinary-signature', requireAuth, requireAdmin, (req, res) => {
  const err = cloudinaryConfigErrorResponse();
  if (err) return res.status(err.status).json(err.body);
  const folder = req.body?.folder || 'qelmora/products';
  res.json(createUploadSignature(folder));
});

async function saveProduct(conn, productId, body, isUpdate = false) {
  const {
    name,
    slug,
    description = '',
    price,
    compareAtPrice = null,
    categoryId = null,
    isFeatured = false,
    isNewArrival = false,
    isActive = true,
    media = [],
    variants = [],
  } = body;

  if (!name || !slug || !Number.isFinite(Number(price)) || Number(price) <= 0)
    throw Object.assign(new Error('Valid name, slug and price are required'), { status: 400 });
  if (!Array.isArray(variants) || variants.length === 0)
    throw Object.assign(new Error('At least one variant is required'), { status: 400 });

  let id = productId;
  if (isUpdate) {
    await conn.execute(
      `UPDATE products SET category_id=?,name=?,slug=?,description=?,price=?,compare_at_price=?,is_featured=?,is_new_arrival=?,is_active=? WHERE id=?`,
      [categoryId, name, slug, description, Number(price), compareAtPrice, isFeatured, isNewArrival, isActive, id]
    );
    await conn.execute('DELETE FROM product_media WHERE product_id=?', [id]);
    await conn.execute('DELETE FROM product_variants WHERE product_id=?', [id]);
  } else {
    const [result] = await conn.execute(
      `INSERT INTO products (category_id,name,slug,description,price,compare_at_price,is_featured,is_new_arrival,is_active)
       VALUES (?,?,?,?,?,?,?,?,?)`,
      [categoryId, name, slug, description, Number(price), compareAtPrice, isFeatured, isNewArrival, isActive]
    );
    id = result.insertId;
  }

  for (const m of media) {
    if (!m.secure_url && !m.secureUrl) throw new Error('Invalid media metadata');
    const url = m.secure_url || m.secureUrl;
    const type = m.resource_type || m.resourceType;
    if (!['image', 'video'].includes(type)) throw new Error('Invalid media type');
    await conn.execute(
      'INSERT INTO product_media (product_id,resource_type,secure_url,public_id,alt_text,sort_order) VALUES (?,?,?,?,?,?)',
      [id, type, url, m.public_id || m.publicId, m.alt_text || m.altText || null, Number(m.sort_order ?? m.sortOrder) || 0]
    );
  }
  for (const v of variants) {
    if (!v.sku || !v.size || !v.color || !Number.isInteger(Number(v.stock)) || Number(v.stock) < 0)
      throw new Error('Invalid product variant');
    await conn.execute(
      'INSERT INTO product_variants (product_id,sku,size,color,stock,price_override) VALUES (?,?,?,?,?,?)',
      [id, v.sku, v.size, v.color, Number(v.stock), v.price_override ?? v.priceOverride ?? null]
    );
  }
  return id;
}

router.post('/admin', requireAuth, requireAdmin, async (req, res, next) => {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const id = await saveProduct(conn, null, req.body, false);
    await conn.commit();
    res.status(201).json({ id, message: 'Product created' });
  } catch (e) {
    await conn.rollback();
    let status = e.status || 500;
    let message = e.message;
    if (e.code === 'ER_DUP_ENTRY') {
      status = 409;
      message = 'A product with this slug or SKU already exists.';
    }
    res.status(status).json({ message });
  } finally {
    conn.release();
  }
});

router.put('/admin/:id', requireAuth, requireAdmin, async (req, res, next) => {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const id = await saveProduct(conn, Number(req.params.id), req.body, true);
    await conn.commit();
    res.json({ id, message: 'Product updated' });
  } catch (e) {
    await conn.rollback();
    let status = e.status || 500;
    let message = e.message;
    if (e.code === 'ER_DUP_ENTRY') {
      status = 409;
      message = 'A product with this slug or SKU already exists.';
    }
    res.status(status).json({ message });
  } finally {
    conn.release();
  }
});

router.delete('/admin/:id', requireAuth, requireAdmin, async (req, res, next) => {
  try {
    await pool.execute('UPDATE products SET is_active=0 WHERE id=?', [req.params.id]);
    res.json({ message: 'Product deactivated' });
  } catch (e) {
    next(e);
  }
});

export default router;
