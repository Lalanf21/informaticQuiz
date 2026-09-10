import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';
import type { Database as DBType } from 'better-sqlite3';

export let db: DBType;

export function setupTestDb(): void {
  db = new Database(':memory:');
  const sql = fs.readFileSync(path.join(__dirname, '..', 'src', 'db', 'schema.sql'), 'utf-8');
  db.exec(sql);
}

export function buildTestApp(): express.Express {
  const app = express();
  app.use(helmet());
  app.use(cors());
  app.use(express.json());
  return app;
}
