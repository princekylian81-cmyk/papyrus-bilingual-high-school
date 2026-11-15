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
  const reviewColumns = [
    ['decision_note', 'VARCHAR(500) NULL'],
    ['reviewed_at', 'DATETIME NULL'],
    ['payment_status', "ENUM('unpaid', 'declared') NOT NULL DEFAULT 'unpaid'"],
    ['payment_method', "ENUM('orange-money', 'mtn-momo', 'bank-transfer') NULL"],
    ['payment_reference', 'VARCHAR(80) NULL'],
    ['payment_declared_at', 'DATETIME NULL']
  ];
  for (const [column, definition] of reviewColumns) {
    const [existing] = await connection.query(
      `SELECT COUNT(*) AS total
       FROM information_schema.COLUMNS
       WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'applications' AND COLUMN_NAME = ?`,
      [databaseConfig.database, column]
    );
    if (Number(existing[0].total) === 0) {
      await connection.query(`ALTER TABLE applications ADD COLUMN ${column} ${definition}`);
    }
  }
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
  const databaseName = connection.escapeId(databaseConfig.database);
  await connection.query(
    `GRANT SELECT, INSERT ON ${databaseName}.* TO '${applicationUser}'@'%'`
  );
  await connection.query(
    `GRANT UPDATE (status, decision_note, reviewed_at, payment_status, payment_method, payment_reference, payment_declared_at)
     ON ${databaseName}.applications TO '${applicationUser}'@'%'`
  );
  console.log('MySQL schema is ready.');
} finally {
  await connection.end();
}