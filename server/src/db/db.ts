import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';

const rawPath = process.env.DATABASE_PATH || '../data/informaticquiz.db';
const dbPath =
  rawPath === ':memory:'
    ? ':memory:'
    : path.isAbsolute(rawPath)
      ? rawPath
      : path.resolve(__dirname, '..', '..', rawPath);

if (dbPath !== ':memory:') {
  fs.mkdirSync(path.dirname(dbPath), { recursive: true });
}

export const db = new Database(dbPath);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

export function getDb(): Database.Database {
  return db;
}
