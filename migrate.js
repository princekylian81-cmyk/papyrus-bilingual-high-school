import 'dotenv/config';
import { readFile } from 'node:fs/promises';
import mysql from 'mysql2/promise';
import { databaseConfig } from './db.js';

const connection = await mysql.createConnection({
  ...databaseConfig,
  user: process.env.DB_MIGRATION_USER || databaseConfig.user,
  password: process.env.DB_MIGRATION_PASSWORD || databaseConfig.password,
  multipleStatements: true
});

try {
  const schema = await readFile(new URL('./schema.sql', import.meta.url), 'utf8');
  await connection.query(schema);
  console.log('MySQL schema is ready.');
} finally {
  await connection.end();
}