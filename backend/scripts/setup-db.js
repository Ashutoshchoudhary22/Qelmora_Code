import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { ensureDatabaseSchema, getDbName, getDbConnectionConfig, hasCoreTables } from '../src/db/schema-init.js';
import mysql from 'mysql2/promise';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../.env') });

async function main() {
  const result = await ensureDatabaseSchema();
  const dbName = getDbName();
  const conn = await mysql.createConnection({ ...getDbConnectionConfig(), database: dbName });
  const has = await hasCoreTables(conn, dbName);
  const [tables] = await conn.query('SHOW TABLES');
  await conn.end();

  if (result.created) {
    console.log(`Done. Created schema in "${dbName}".`);
  } else if (has) {
    console.log(`Done. "${dbName}" already has tables (${tables.length} total).`);
  }
}

main().catch((err) => {
  console.error('Database setup failed:', err.message);
  process.exit(1);
});