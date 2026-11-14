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
  const applicationUser = databaseConfig.user;
  const applicationPassword = databaseConfig.password;
  if (!/^[A-Za-z0-9_]+$/.test(applicationUser)) {
    throw new Error('DB_USER must contain only letters, numbers, or underscores.');
  }
  await connection.query(
    `CREATE USER IF NOT EXISTS '${applicationUser}'@'%' IDENTIFIED BY ${connection.escape(applicationPassword)}`
  );
  await connection.query(
    `ALTER USER '${applicationUser}'@'%' IDENTIFIED BY ${connection.escape(applicationPassword)}`
  );
  await connection.query(
    `GRANT SELECT, INSERT ON ${connection.escapeId(databaseConfig.database)}.* TO '${applicationUser}'@'%'`
  );
  console.log('MySQL schema is ready.');
} finally {
  await connection.end();
}