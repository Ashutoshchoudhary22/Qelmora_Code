import { pool } from '../config/db.js';
import { ensureDatabaseSchema } from '../db/schema-init.js';

let categoryMediaReady = false;
let siteSectionsReady = false;
let instagramReady = false;
let bannerPlacementReady = false;
let contactMessagesReady = false;
let bannerMobileReady = false;

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
    ['instagram', '@qelmora on Instagram', 'Instagram', null, null, 'https://instagram.com']
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

export async function runStartupMigrations() {
  await ensureDatabaseSchema();
  await ensureCategoryMediaColumn();
  await ensureSiteSectionsTable();
  await ensureInstagramTable();
  await ensureBannerPlacementEnum();
  await ensureBannerMobileMediaColumns();
  await ensureContactMessagesTable();
}
