import fs from 'fs';
import path from 'path';
import { db } from './db';

export function migrate(): void {
  const schemaPath = path.join(__dirname, 'schema.sql');
  const sql = fs.readFileSync(schemaPath, 'utf-8');
  db.exec(sql);
}

if (require.main === module) {
  migrate();
  console.log('Migration complete.');
}
