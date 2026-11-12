import 'dotenv/config';
import mysql from 'mysql2/promise';

const sql =
  "ALTER TABLE categories ADD COLUMN media_type ENUM('image','video') NOT NULL DEFAULT 'image' AFTER image_url";

const pool = await mysql.createConnection({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASS ?? process.env.DB_PASSWORD ?? '',
  database: process.env.DB_NAME || 'qelmora',
});

try {
  await pool.execute(sql);
  console.log('Added categories.media_type');
} catch (e) {
  if (e.code === 'ER_DUP_FIELDNAME') console.log('categories.media_type already exists');
  else throw e;
} finally {
  await pool.end();
}
