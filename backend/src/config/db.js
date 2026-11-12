import mysql from 'mysql2/promise';

export const pool = mysql.createPool({
  host: process.env.DB_HOST || process.env.MYSQL_HOST,
  port: Number(process.env.MYSQL_PORT || 3306),
  user: process.env.DB_USER || process.env.MYSQL_USER,
  password: process.env.DB_PASS ?? process.env.DB_PASSWORD ?? process.env.MYSQL_PASSWORD ?? '',
  database: process.env.DB_NAME || process.env.MYSQL_DATABASE,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  enableKeepAlive: true,
  charset: 'utf8mb4',
  decimalNumbers: true
});
