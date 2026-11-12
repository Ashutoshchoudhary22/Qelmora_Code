import { pool } from '../config/db.js';

let categoryMediaReady = false;
let siteSectionsReady = false;
let instagramReady = false;

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
      'hello@qelmora.com · Mon–Sat, 10am–7pm IST\nBandra Kurla Complex, Mumbai, India',
      null,
      null,
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

export async function runStartupMigrations() {
  await ensureCategoryMediaColumn();
  await ensureSiteSectionsTable();
  await ensureInstagramTable();
}
