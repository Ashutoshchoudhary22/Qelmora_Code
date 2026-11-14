import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import mysql from 'mysql2/promise';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, '../../..');

export function getDbName() {
  return process.env.DB_NAME || process.env.MYSQL_DATABASE || 'qelmora';
}

export function getDbConnectionConfig(overrides = {}) {
  return {
    host: process.env.DB_HOST || process.env.MYSQL_HOST || 'localhost',
    port: Number(process.env.MYSQL_PORT || 3306),
    user: process.env.DB_USER || process.env.MYSQL_USER || 'root',
    password: process.env.DB_PASS ?? process.env.DB_PASSWORD ?? process.env.MYSQL_PASSWORD ?? '',
    ...overrides,
  };
}

export function stripDbPreamble(sql) {
  return sql
    .replace(/CREATE DATABASE IF NOT EXISTS[^;]+;\s*/gi, '')
    .replace(/USE\s+[\w`]+\s*;\s*/gi, '');
}

/** Returns true if the core `users` table exists in the configured database. */
export async function hasCoreTables(conn, dbName) {
  const [rows] = await conn.query(
    `SELECT COUNT(*) AS c FROM information_schema.tables
     WHERE table_schema = ? AND table_name = 'users'`,
    [dbName]
  );
  return Number(rows[0]?.c || 0) > 0;
}

export async function ensureDatabaseSchema() {
  const dbName = getDbName();
  const conn = await mysql.createConnection({
    ...getDbConnectionConfig(),
    multipleStatements: true,
  });

  try {
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

    if (await hasCoreTables(conn, dbName)) {
      return { created: false, dbName };
    }

    const schemaPath = path.join(projectRoot, 'database', '001_schema.sql');
    const seedPath = path.join(projectRoot, 'database', '002_seed.sql');
    if (!fs.existsSync(schemaPath)) {
      throw new Error(`Schema file not found: ${schemaPath}`);
    }

    console.log(`Database: "${dbName}" has no tables — applying schema…`);
    await conn.query(stripDbPreamble(fs.readFileSync(schemaPath, 'utf8')));

    if (fs.existsSync(seedPath)) {
      console.log('Database: applying seed data…');
      await conn.query(stripDbPreamble(fs.readFileSync(seedPath, 'utf8')));
    }

    const [tables] = await conn.query('SHOW TABLES');
    console.log(`Database: initialized (${tables.length} tables in "${dbName}")`);
    return { created: true, dbName, tableCount: tables.length };
  } finally {
    await conn.end();
  }
}