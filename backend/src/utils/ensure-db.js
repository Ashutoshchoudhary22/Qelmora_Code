import { pool } from '../config/db.js';
import { ensureDatabaseSchema } from '../db/schema-init.js';

let categoryMediaReady = false;
let siteSectionsReady = false;
let instagramReady = false;
let bannerPlacementReady = false;
let contactMessagesReady = false;
let bannerMobileReady = false;
let productCategoriesReady = false;
let accountOverviewTilesReady = false;

export async function ensureCategoryMediaColumn() {
  if (categoryMediaReady) return;
  try {
    await pool.execute(
      "ALTER TABLE categories ADD COLUMN media_type ENUM('image','video') NOT NULL DEFAULT 'image' AFTER image_url"
    );
    console.log('Database: added categories.media_type');
  } catch (e) {
    if (e.code !== 'ER_DUP_FIELDNAME') throw e;
  }
  categoryMediaReady = true;
}

export async function ensureSiteSectionsTable() {
  if (siteSectionsReady) return;
  await pool.execute(`
    CREATE TABLE IF NOT EXISTS site_sections (
      section_key VARCHAR(40) NOT NULL PRIMARY KEY,
      eyebrow VARCHAR(120) NOT NULL DEFAULT '',
      headline TEXT NOT NULL,
      body TEXT NULL,
      cta_label VARCHAR(80) NULL,
      cta_link VARCHAR(500) NULL,
      image_url VARCHAR(1000) NULL,
      media_type ENUM('image','video') NOT NULL DEFAULT 'image',
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB
  `);
  try {
    await pool.execute(`ALTER TABLE site_sections ADD COLUMN dark_image_url VARCHAR(1000) NULL`);
  } catch {
    /* column exists */
  }
  try {
    await pool.execute(
      `ALTER TABLE site_sections ADD COLUMN dark_media_type ENUM('image','video') NOT NULL DEFAULT 'image'`
    );
  } catch {
    /* column exists */
  }
  await pool.execute(
    `INSERT INTO site_sections (section_key, eyebrow, headline, body, cta_label, cta_link)
     VALUES (?,?,?,?,?,?)
     ON DUPLICATE KEY UPDATE section_key=section_key`,
    [
      'brand_story',
      'Brand story',
      'QELMORA began with a refusal — to chase trends, to shout, to compromise on the stitch.',
      'We make fewer pieces, with better fiber, for people who treat clothing as identity, not ornament. Every release is a chapter — yours to wear in.',
      'Read the full story',
      '/about',
    ]
  );
  await pool.execute(
    `INSERT INTO site_sections (section_key, eyebrow, headline, body, cta_label, cta_link)
     VALUES (?,?,?,?,?,?)
     ON DUPLICATE KEY UPDATE section_key=section_key`,
    [
      'instagram',
      '@qelmora on Instagram',
      'From Our Instagram',
      'Latest drops, real looks & love from our community.',
      'Follow Us on Instagram',
      'https://instagram.com/qelmora',
    ]
  );
  await pool.execute(
    `INSERT INTO site_sections (section_key, eyebrow, headline, body, cta_label, cta_link)
     VALUES (?,?,?,?,?,?)
     ON DUPLICATE KEY UPDATE section_key=section_key`,
    [
      'about',
      'About us',
      'The QELMORA edit',
      'Founded on the belief that luxury is restraint, QELMORA designs modular wardrobes for people who travel light and dress with intent. We partner with mills in Gujarat and Tamil Nadu, finish in small batches, and release only what we would wear ourselves.',
      null,
      null,
    ]
  );
  await pool.execute(
    `INSERT INTO site_sections (section_key, eyebrow, headline, body, cta_label, cta_link)
     VALUES (?,?,?,?,?,?)
     ON DUPLICATE KEY UPDATE section_key=section_key`,
    [
      'contact',
      'Contact',
      'Client care',
      'Mon–Sat, 10am–7pm IST\nBandra Kurla Complex, Mumbai, India',
      'Fill the form or email us on',
      'hello@qelmora.com',
    ]
  );
  await pool.execute(
    `INSERT INTO site_sections (section_key, eyebrow, headline, body, cta_label, cta_link)
     VALUES (?,?,?,?,?,?)
     ON DUPLICATE KEY UPDATE section_key=section_key`,
    [
      'login_banner',
      'Join the edit',
      'ALL EYES ON YOU',
      null,
      null,
      null,
    ]
  );
  await pool.execute(
    `INSERT INTO site_sections (section_key, eyebrow, headline, body, cta_label, cta_link, image_url, media_type)
     VALUES (?,?,?,?,?,?,?,?)
     ON DUPLICATE KEY UPDATE section_key=section_key`,
    [
      'login_form_band',
      'Login',
      'Login form area background',
      'Background behind the sign-in / register form column on /login and /register.',
      null,
      null,
      null,
      'image',
    ]
  );
  await pool.execute(
    `INSERT INTO site_sections (section_key, eyebrow, headline, body, cta_label, cta_link, image_url, media_type)
     VALUES (?,?,?,?,?,?,?,?)
     ON DUPLICATE KEY UPDATE section_key=section_key`,
    [
      'account_hero',
      'Account',
      'Profile header background',
      'Wide lifestyle image behind the hello card on /account.',
      null,
      null,
      null,
      'image',
    ]
  );
  await pool.execute(
    `INSERT INTO site_sections (section_key, eyebrow, headline, body, cta_label, cta_link, image_url, media_type)
     VALUES (?,?,?,?,?,?,?,?)
     ON DUPLICATE KEY UPDATE section_key=section_key`,
    [
      'site_footer',
      'Footer',
      'Site footer background',
      'Optional full-width background image for the storefront footer.',
      null,
      null,
      null,
      'image',
    ]
  );
  await pool.execute(
    `INSERT INTO site_sections (section_key, eyebrow, headline, body, cta_label, cta_link, image_url, media_type)
     VALUES (?,?,?,?,?,?,?,?)
     ON DUPLICATE KEY UPDATE section_key=section_key`,
    [
      'newsletter_band',
      'Newsletter',
      'Newsletter band background',
      'Background for the Join the inner circle section above the footer.',
      null,
      null,
      null,
      'image',
    ]
  );
  await pool.execute(
    `INSERT INTO site_sections (section_key, eyebrow, headline, body, cta_label, cta_link, image_url, media_type)
     VALUES (?,?,?,?,?,?,?,?)
     ON DUPLICATE KEY UPDATE section_key=section_key`,
    [
      'brand_story_band',
      'Brand story',
      'Brand story band background',
      'Background for the homepage brand story section.',
      null,
      null,
      null,
      'image',
    ]
  );
  await pool.execute(
    `INSERT INTO site_sections (section_key, eyebrow, headline, body, cta_label, cta_link, image_url, media_type)
     VALUES (?,?,?,?,?,?,?,?)
     ON DUPLICATE KEY UPDATE section_key=section_key`,
    [
      'featured_collection_band',
      'Featured collection',
      'Featured collection band background',
      'Background for the homepage featured collection section.',
      null,
      null,
      null,
      'image',
    ]
  );
  await pool.execute(
    `INSERT INTO site_sections (section_key, eyebrow, headline, body, cta_label, cta_link, image_url, media_type)
     VALUES (?,?,?,?,?,?,?,?)
     ON DUPLICATE KEY UPDATE section_key=section_key`,
    [
      'instagram_band',
      'Instagram',
      'Instagram band background',
      'Background for the homepage Instagram feed section above the newsletter.',
      null,
      null,
      null,
      'image',
    ]
  );
  await pool.execute(
    `INSERT INTO site_sections (section_key, eyebrow, headline, body, cta_label, cta_link, image_url, media_type)
     VALUES (?,?,?,?,?,?,?,?)
     ON DUPLICATE KEY UPDATE section_key=section_key`,
    [
      'promo_band',
      'Promo',
      'Limited offer / promo band background',
      'Full-width background behind the homepage limited offer promo strip. Photo/video in the card still comes from Admin → Banners (promo).',
      null,
      null,
      null,
      'image',
    ]
  );
  await pool.execute(
    `INSERT INTO site_sections (section_key, eyebrow, headline, body, cta_label, cta_link, image_url, media_type)
     VALUES (?,?,?,?,?,?,?,?)
     ON DUPLICATE KEY UPDATE section_key=section_key`,
    [
      'shop_by_category_band',
      'Shop by category',
      'Shop by category band background',
      'Background behind the homepage Shop by category section. Tiles still come from Admin → Home shop by category.',
      null,
      null,
      null,
      'image',
    ]
  );
  await pool.execute(
    `INSERT INTO site_sections (section_key, eyebrow, headline, body, cta_label, cta_link, image_url, media_type)
     VALUES (?,?,?,?,?,?,?,?)
     ON DUPLICATE KEY UPDATE section_key=section_key`,
    [
      'new_arrivals_band',
      'New arrivals',
      'New arrivals band background',
      'Legacy single homepage new arrivals background (use home_men / home_women keys instead).',
      null,
      null,
      null,
      'image',
    ]
  );
  const homeNewArrivalsBands = [
    [
      'home_men_new_arrivals_band',
      "Homepage — men's new arrivals",
      "Background behind the Men's grid in Just landed / New arrivals on the homepage.",
    ],
    [
      'home_women_new_arrivals_band',
      "Homepage — women's new arrivals",
      "Background behind the Women's grid in Just landed / New arrivals on the homepage.",
    ],
  ];
  for (const [key, headline, body] of homeNewArrivalsBands) {
    await pool.execute(
      `INSERT INTO site_sections (section_key, eyebrow, headline, body, cta_label, cta_link, image_url, media_type)
       VALUES (?,?,?,?,?,?,?,?)
       ON DUPLICATE KEY UPDATE section_key=section_key`,
      [key, 'New arrivals', headline, body, null, null, null, 'image']
    );
  }
  await pool.execute(
    `INSERT INTO site_sections (section_key, eyebrow, headline, body, cta_label, cta_link, image_url, media_type)
     VALUES (?,?,?,?,?,?,?,?)
     ON DUPLICATE KEY UPDATE section_key=section_key`,
    [
      'shop_men_offers_band',
      'Shop offers',
      "Men's shop offers band background",
      'Background behind the offer carousel on /shop/men. Offer slides still come from Admin → Shop offers.',
      null,
      null,
      null,
      'image',
    ]
  );
  await pool.execute(
    `INSERT INTO site_sections (section_key, eyebrow, headline, body, cta_label, cta_link, image_url, media_type)
     VALUES (?,?,?,?,?,?,?,?)
     ON DUPLICATE KEY UPDATE section_key=section_key`,
    [
      'shop_women_offers_band',
      'Shop offers',
      "Women's shop offers band background",
      'Background behind the offer carousel on /shop/women. Offer slides still come from Admin → Shop offers.',
      null,
      null,
      null,
      'image',
    ]
  );
  await pool.execute(
    `INSERT INTO site_sections (section_key, eyebrow, headline, body, cta_label, cta_link, image_url, media_type)
     VALUES (?,?,?,?,?,?,?,?)
     ON DUPLICATE KEY UPDATE section_key=section_key`,
    [
      'about_band',
      'About',
      'About page background',
      'Full-width background on /about. Story image stays in About editor below.',
      null,
      null,
      null,
      'image',
    ]
  );
  await pool.execute(
    `INSERT INTO site_sections (section_key, eyebrow, headline, body, cta_label, cta_link, image_url, media_type)
     VALUES (?,?,?,?,?,?,?,?)
     ON DUPLICATE KEY UPDATE section_key=section_key`,
    [
      'contact_band',
      'Contact',
      'Contact page background',
      'Full-width background on /contact. Sidebar image stays in Contact editor below.',
      null,
      null,
      null,
      'image',
    ]
  );
  await pool.execute(
    `INSERT INTO site_sections (section_key, eyebrow, headline, body, cta_label, cta_link, image_url, media_type)
     VALUES (?,?,?,?,?,?,?,?)
     ON DUPLICATE KEY UPDATE section_key=section_key`,
    [
      'nowhere_else_band',
      'Nowhere Else',
      'Nowhere Else page background',
      'Background behind /collections (Nowhere Else). Tiles still come from Admin → Nowhere Else.',
      null,
      null,
      null,
      'image',
    ]
  );
  const shopSectionBands = [
    ['shop_men_collection_band', "Men's shop — collection section", 'Shop the edit block on /shop/men'],
    ['shop_men_new_arrivals_band', "Men's shop — new arrivals section", 'Just landed block on /shop/men'],
    ['shop_men_trending_band', "Men's shop — trending section", 'Trending categories on /shop/men'],
    ['shop_men_best_sellers_band', "Men's shop — best sellers section", 'Best sellers block on /shop/men'],
    ['shop_women_collection_band', "Women's shop — collection section", 'Shop the edit block on /shop/women'],
    ['shop_women_new_arrivals_band', "Women's shop — new arrivals section", 'Just landed block on /shop/women'],
    ['shop_women_trending_band', "Women's shop — trending section", 'Trending categories on /shop/women'],
    ['shop_women_best_sellers_band', "Women's shop — best sellers section", 'Best sellers block on /shop/women'],
  ];
  for (const [key, headline, body] of shopSectionBands) {
    await pool.execute(
      `INSERT INTO site_sections (section_key, eyebrow, headline, body, cta_label, cta_link, image_url, media_type)
       VALUES (?,?,?,?,?,?,?,?)
       ON DUPLICATE KEY UPDATE section_key=section_key`,
      [key, 'Shop sections', headline, body, null, null, null, 'image']
    );
  }
  siteSectionsReady = true;
}

export async function ensureInstagramTable() {
  if (instagramReady) return;
  await pool.execute(`
    CREATE TABLE IF NOT EXISTS instagram_posts (
      id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      secure_url VARCHAR(1000) NOT NULL,
      public_id VARCHAR(255) NOT NULL,
      resource_type ENUM('image','video') NOT NULL DEFAULT 'image',
      link_url VARCHAR(500) NULL,
      sort_order INT NOT NULL DEFAULT 0,
      is_active BOOLEAN NOT NULL DEFAULT TRUE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_instagram_active_sort (is_active, sort_order)
    ) ENGINE=InnoDB
  `);
  instagramReady = true;
}

export async function ensureBannerPlacementEnum() {
  if (bannerPlacementReady) return;
  try {
    await pool.execute(
      `ALTER TABLE homepage_banners MODIFY placement ENUM('hero','promo','collection','announcement','shop_men','shop_women','shop_new_arrivals','shop_trending_men','shop_trending_women','home_shop_by_category','page_nowhere_else') NOT NULL DEFAULT 'hero'`
    );
    console.log('Database: extended homepage_banners.placement (shop offers)');
  } catch (e) {
    if (e.code !== 'ER_BAD_FIELD_ERROR' && e.code !== 'ER_PARSE_ERROR') throw e;
  }
  bannerPlacementReady = true;
}

export async function ensureBannerMobileMediaColumns() {
  if (bannerMobileReady) return;
  try {
    await pool.execute(
      `ALTER TABLE homepage_banners
       ADD COLUMN mobile_resource_type ENUM('image','video') NULL AFTER public_id,
       ADD COLUMN mobile_secure_url VARCHAR(1000) NULL AFTER mobile_resource_type,
       ADD COLUMN mobile_public_id VARCHAR(255) NULL AFTER mobile_secure_url`
    );
    console.log('Database: added homepage_banners mobile media columns');
  } catch (e) {
    if (e.code !== 'ER_DUP_FIELDNAME') throw e;
  }
  bannerMobileReady = true;
}

export async function ensureContactMessagesTable() {
  if (contactMessagesReady) return;
  await pool.execute(`
    CREATE TABLE IF NOT EXISTS contact_messages (
      id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(120) NOT NULL,
      email VARCHAR(190) NOT NULL,
      phone VARCHAR(30) NULL,
      message TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_contact_created (created_at)
    ) ENGINE=InnoDB
  `);
  contactMessagesReady = true;
}

export async function ensureProductCategoriesTable() {
  if (productCategoriesReady) return;
  await pool.execute(`
    CREATE TABLE IF NOT EXISTS product_categories (
      product_id BIGINT UNSIGNED NOT NULL,
      category_id BIGINT UNSIGNED NOT NULL,
      PRIMARY KEY (product_id, category_id),
      CONSTRAINT fk_pc_product FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
      CONSTRAINT fk_pc_category FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE,
      INDEX idx_pc_category (category_id)
    ) ENGINE=InnoDB
  `);
  await pool.execute(`
    INSERT IGNORE INTO product_categories (product_id, category_id)
    SELECT id, category_id FROM products WHERE category_id IS NOT NULL
  `);
  productCategoriesReady = true;
}

export async function ensureAccountOverviewTilesTable() {
  if (accountOverviewTilesReady) return;
  await pool.execute(`
    CREATE TABLE IF NOT EXISTS account_overview_tiles (
      id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      title VARCHAR(120) NOT NULL,
      description VARCHAR(500) NOT NULL DEFAULT '',
      link_path VARCHAR(500) NOT NULL,
      icon_key VARCHAR(40) NOT NULL DEFAULT 'package',
      image_url VARCHAR(1000) NULL,
      tile_key VARCHAR(40) NULL,
      sort_order INT NOT NULL DEFAULT 0,
      is_active BOOLEAN NOT NULL DEFAULT TRUE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_account_tiles_active_sort (is_active, sort_order)
    ) ENGINE=InnoDB
  `);
  const [countRows] = await pool.execute('SELECT COUNT(*) AS c FROM account_overview_tiles');
  if (Number(countRows[0]?.c) === 0) {
    const seeds = [
      ['My Orders', 'View, modify and track orders', '/account/orders', 'package', null, 'orders', 0],
      ['My Addresses', 'Edit, add or remove addresses', '/account/addresses', 'map-pin', null, 'addresses', 1],
      ['My Profile', 'Edit personal info and account details', '/account/profile', 'user', null, 'profile', 2],
      ['Help & Support', 'Reach out to us', '/contact', 'headphones', null, 'help', 3],
      ['Our Story', 'The QELMORA chapter', '/about', 'book-open', null, 'story', 4],
      ['Nowhere Else', 'Exclusive collections', '/collections', 'sparkles', null, 'collections', 5],
    ];
    for (const row of seeds) {
      await pool.execute(
        `INSERT INTO account_overview_tiles (title, description, link_path, icon_key, image_url, tile_key, sort_order)
         VALUES (?,?,?,?,?,?,?)`,
        row
      );
    }
  }
  accountOverviewTilesReady = true;
}

export async function runStartupMigrations() {
  await ensureDatabaseSchema();
  await ensureCategoryMediaColumn();
  await ensureSiteSectionsTable();
  await ensureInstagramTable();
  await ensureBannerPlacementEnum();
  await ensureBannerMobileMediaColumns();
  await ensureContactMessagesTable();
  await ensureProductCategoriesTable();
  await ensureAccountOverviewTilesTable();
}
