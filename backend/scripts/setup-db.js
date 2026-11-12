import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '../..');

dotenv.config({ path: path.join(__dirname, '../.env') });

const dbName = process.env.DB_NAME || process.env.MYSQL_DATABASE || 'qelmora';

function stripDbPreamble(sql) {
  return sql
    .replace(/CREATE DATABASE IF NOT EXISTS[^;]+;\s*/gi, '')
    .replace(/USE\s+[\w`]+\s*;\s*/gi, '');
}

async function main() {
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST || process.env.MYSQL_HOST || 'localhost',
    port: Number(process.env.MYSQL_PORT || 3306),
    user: process.env.DB_USER || process.env.MYSQL_USER || 'root',
    password: process.env.DB_PASS ?? process.env.DB_PASSWORD ?? process.env.MYSQL_PASSWORD ?? '',
    multipleStatements: true,
  });

  console.log(`Creating database "${dbName}" if needed…`);
  try {
    await conn.query(
      `CREATE DATABASE IF NOT EXISTS \`${dbName}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci`
    );
  } catch {
    await conn.query(
      `CREATE DATABASE IF NOT EXISTS \`${dbName}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`
    );
  }
  await conn.query(`USE \`${dbName}\``);

  const schemaPath = path.join(root, 'database', '001_schema.sql');
  const seedPath = path.join(root, 'database', '002_seed.sql');

  if (!fs.existsSync(schemaPath)) {
    throw new Error(`Schema file not found: ${schemaPath}`);
  }

  console.log('Applying schema…');
  const schemaSql = stripDbPreamble(fs.readFileSync(schemaPath, 'utf8'));
  await conn.query(schemaSql);

  if (fs.existsSync(seedPath)) {
    console.log('Applying seed data…');
    const seedSql = stripDbPreamble(fs.readFileSync(seedPath, 'utf8'));
    await conn.query(seedSql);
  }

  const [tables] = await conn.query('SHOW TABLES');
  console.log(`Done. ${tables.length} tables in "${dbName}".`);
  await conn.end();
}

main().catch((err) => {
  console.error('Database setup failed:', err.message);
  process.exit(1);
});
