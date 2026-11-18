import { Router } from 'express';
import { pool } from '../config/db.js';
import { requireAuth, requireAdmin } from '../middleware/auth.js';
import { cloudinaryConfigErrorResponse, createUploadSignature } from '../utils/cloudinary-sign.js';

const router = Router();

const SIZE_ORDER = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];

const PRICE_BUCKET_IDS = ['400_699', '700_999', '1000_1499', '1500_above', 'under399'];

function priceBucketSql(bucketId) {
  switch (bucketId) {
    case 'under399':
      return 'p.price < 399';
    case '400_699':
      return 'p.price >= 400 AND p.price <= 699';
    case '700_999':
      return 'p.price >= 700 AND p.price <= 999';
    case '1000_1499':
      return 'p.price >= 1000 AND p.price <= 1499';
    case '1500_above':
      return 'p.price >= 1500';
    default:
      return null;
  }
}

function parsePriceBuckets(raw) {
  return parseCsvQuery(raw, 8).filter((id) => PRICE_BUCKET_IDS.includes(id));
}

function parseCsvQuery(raw, max = 24) {
  if (!raw) return [];
  return String(raw)
  .split(',')
  .map((s) => s.trim().slice(0, 40))
  .filter(Boolean)
  .slice(0, max);
}

function productListOrder(sort) {
  switch (sort) {
    case 'price_asc':
      return 'p.price ASC, p.created_at DESC';
    case 'price_desc':
      return 'p.price DESC, p.created_at DESC';
    case 'name_asc':
      return 'p.name ASC';
    default:
      return 'p.is_featured DESC, p.is_new_arrival DESC, p.created_at DESC';
  }
}

function buildProductListQuery(req, { applyPriceFilter = true } = {}) {
  const categorySlug = req.query.category;
  const featured = req.query.featured === '1';
  const newArrival = req.query.newArrival === '1';
  const search = `%${String(req.query.search || '').slice(0, 80)}%`;
  const sizes = parseCsvQuery(req.query.sizes);
  const colors = parseCsvQuery(req.query.colors);
  const prices = applyPriceFilter ? parsePriceBuckets(req.query.prices) : [];
  const sort = String(req.query.sort || 'newest').slice(0, 20);

  let where = 'p.is_active=1';
  const params = [];
  if (search !== '%%') {
    where += ' AND p.name LIKE ?';
    params.push(search);
  }
  if (categorySlug) {
    where += ` AND (
      c.slug = ?
      OR EXISTS (
        SELECT 1 FROM product_categories pc
        INNER JOIN categories cx ON cx.id = pc.category_id
        WHERE pc.product_id = p.id AND cx.slug = ?
      )
    )`;
    params.push(categorySlug, categorySlug);
  }
  if (featured) where += ' AND p.is_featured=1';
  if (newArrival) where += ' AND p.is_new_arrival=1';

  if (sizes.length) {
    const placeholders = sizes.map(() => '?').join(',');
    where += ` AND EXISTS (
      SELECT 1 FROM product_variants pv
      WHERE pv.product_id = p.id AND pv.stock > 0 AND pv.size IN (${placeholders})
    )`;
    params.push(...sizes);
  }
  if (colors.length) {
    const placeholders = colors.map(() => '?').join(',');
    where += ` AND EXISTS (
      SELECT 1 FROM product_variants pv
      WHERE pv.product_id = p.id AND pv.stock > 0 AND pv.color IN (${placeholders})
    )`;
    params.push(...colors);
  }

  if (prices.length) {
    const clauses = prices.map((id) => priceBucketSql(id)).filter(Boolean);
    if (clauses.length) where += ` AND (${clauses.join(' OR ')})`;
  }

  return { where, params, sort: productListOrder(sort) };
}

router.get('/facets', async (req, res, next) => {
  try {
    const { where, params } = buildProductListQuery(req);
    const baseFrom = `FROM products p LEFT JOIN categories c ON c.id=p.category_id`;

    const [sizeRows] = await pool.execute(
      `SELECT pv.size AS value, COUNT(DISTINCT p.id) AS count
       ${baseFrom}
       INNER JOIN product_variants pv ON pv.product_id = p.id AND pv.stock > 0 AND pv.size IS NOT NULL AND pv.size <> ''
       WHERE ${where}
       GROUP BY pv.size`,
      params
    );
    const [colorRows] = await pool.execute(
      `SELECT pv.color AS value, COUNT(DISTINCT p.id) AS count
       ${baseFrom}
       INNER JOIN product_variants pv ON pv.product_id = p.id AND pv.stock > 0 AND pv.color IS NOT NULL AND pv.color <> ''
       WHERE ${where}
       GROUP BY pv.color`,
      params
    );

    const sizes = sizeRows
      .map((r) => ({ value: r.value, count: Number(r.count) }))
      .sort((a, b) => {
        const ai = SIZE_ORDER.indexOf(a.value);
        const bi = SIZE_ORDER.indexOf(b.value);
        if (ai === -1 && bi === -1) return String(a.value).localeCompare(String(b.value));
        if (ai === -1) return 1;
        if (bi === -1) return -1;
        return ai - bi;
      });
    const colors = colorRows
      .map((r) => ({ value: r.value, count: Number(r.count) }))
      .sort((a, b) => String(a.value).localeCompare(String(b.value)));

    const { where: whereNoPrice, params: paramsNoPrice } = buildProductListQuery(req, { applyPriceFilter: false });
    const prices = [];
    for (const bucketId of PRICE_BUCKET_IDS) {
      const clause = priceBucketSql(bucketId);
      if (!clause) continue;
      const [priceRows] = await pool.execute(
        `SELECT COUNT(*) AS count ${baseFrom} WHERE ${whereNoPrice} AND (${clause})`,
        paramsNoPrice
      );
      prices.push({ id: bucketId, count: Number(priceRows[0]?.count ?? 0) });
    }

    const [countRows] = await pool.execute(`SELECT COUNT(*) AS total ${baseFrom} WHERE ${where}`, params);

    res.json({
      sizes,
      colors,
      prices,
      total: Number(countRows[0]?.total ?? 0),
    });
  } catch (e) {
    next(e);
  }
});

router.get('/', async (req, res, next) => {
  try {
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(48, Math.max(1, Number(req.query.limit) || 12));
    const offset = (page - 1) * limit;
    const { where, params, sort } = buildProductListQuery(req);

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
       ORDER BY ${sort} LIMIT ? OFFSET ?`,
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
        IFNULL(
          (SELECT GROUP_CONCAT(DISTINCT c2.name ORDER BY c2.name SEPARATOR ',')
           FROM product_categories pc
           JOIN categories c2 ON c2.id = pc.category_id
           WHERE pc.product_id = p.id),
          c.name
        ) AS categoryNames,
        (SELECT GROUP_CONCAT(DISTINCT c2.slug ORDER BY c2.slug SEPARATOR ',')
         FROM product_categories pc
         JOIN categories c2 ON c2.id = pc.category_id
         WHERE pc.product_id = p.id) AS categorySlugs,
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
    const [catRows] = await pool.execute('SELECT category_id FROM product_categories WHERE product_id=?', [product.id]);
    const categoryIds = catRows.length
      ? catRows.map((r) => Number(r.category_id))
      : product.category_id
        ? [Number(product.category_id)]
        : [];
    res.json({
      id: Number(product.id),
      category_id: product.category_id != null ? Number(product.category_id) : null,
      name: product.name,
      slug: product.slug,
      description: product.description,
      price: Number(product.price),
      compareAtPrice: product.compare_at_price != null ? Number(product.compare_at_price) : null,
      isFeatured: Boolean(product.is_featured),
      isNewArrival: Boolean(product.is_new_arrival),
      isActive: Boolean(product.is_active),
      categoryIds,
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
    const categoryId = product.category_id;
    const [related] = categoryId
      ? await pool.execute(
          `SELECT p.slug,p.name,p.price,p.compare_at_price AS compareAtPrice,p.is_new_arrival AS isNewArrival,
            (SELECT secure_url FROM product_media pm WHERE pm.product_id=p.id ORDER BY sort_order,id LIMIT 1) AS image
           FROM products p
           WHERE p.is_active=1 AND p.id<>? AND p.category_id=?
           ORDER BY p.is_featured DESC, p.is_new_arrival DESC, p.created_at DESC
           LIMIT 8`,
          [product.id, categoryId]
        )
      : [[]];
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
    categoryIds: rawCategoryIds,
    isFeatured = false,
    isNewArrival = false,
    isActive = true,
    media = [],
    variants = [],
  } = body;

  const categoryIds = Array.isArray(rawCategoryIds)
    ? [...new Set(rawCategoryIds.map((n) => Number(n)).filter((n) => Number.isInteger(n) && n > 0))]
  : categoryId != null && categoryId !== ''
      ? [Number(categoryId)]
      : [];
  const primaryCategoryId = categoryIds[0] ?? null;

  if (!name || !slug || !Number.isFinite(Number(price)) || Number(price) <= 0)
    throw Object.assign(new Error('Valid name, slug and price are required'), { status: 400 });
  if (!Array.isArray(variants) || variants.length === 0)
    throw Object.assign(new Error('At least one variant is required'), { status: 400 });
  if (!categoryIds.length)
    throw Object.assign(new Error('Select at least one shop category (Men or Women)'), { status: 400 });

  let id = productId;
  if (isUpdate) {
    await conn.execute(
      `UPDATE products SET category_id=?,name=?,slug=?,description=?,price=?,compare_at_price=?,is_featured=?,is_new_arrival=?,is_active=? WHERE id=?`,
      [primaryCategoryId, name, slug, description, Number(price), compareAtPrice, isFeatured, isNewArrival, isActive, id]
    );
    await conn.execute('DELETE FROM product_media WHERE product_id=?', [id]);
    await conn.execute('DELETE FROM product_variants WHERE product_id=?', [id]);
  } else {
    const [result] = await conn.execute(
      `INSERT INTO products (category_id,name,slug,description,price,compare_at_price,is_featured,is_new_arrival,is_active)
       VALUES (?,?,?,?,?,?,?,?,?)`,
      [primaryCategoryId, name, slug, description, Number(price), compareAtPrice, isFeatured, isNewArrival, isActive]
    );
    id = result.insertId;
  }

  await conn.execute('DELETE FROM product_categories WHERE product_id=?', [id]);
  for (const cid of categoryIds) {
    await conn.execute('INSERT INTO product_categories (product_id, category_id) VALUES (?,?)', [id, cid]);
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
  const conn = await pool.getConnection();
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id < 1) return res.status(400).json({ message: 'Invalid product id' });
    const [existing] = await conn.execute('SELECT id, name FROM products WHERE id=? LIMIT 1', [id]);
    if (!existing[0]) return res.status(404).json({ message: 'Product not found' });
    await conn.beginTransaction();
    await conn.execute('DELETE FROM products WHERE id=?', [id]);
    await conn.commit();
    res.json({ message: 'Product deleted', id });
  } catch (e) {
    await conn.rollback();
    next(e);
  } finally {
    conn.release();
  }
});

export default router;
