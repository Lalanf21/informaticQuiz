import { Router } from 'express';
import { db } from '../db/db';

export const topicsRouter = Router();

topicsRouter.get('/', (req, res) => {
  const { grade } = req.query;
  let rows;
  if (grade) {
    rows = db.prepare('SELECT * FROM topics WHERE grade = ? ORDER BY name').all(Number(grade));
  } else {
    rows = db.prepare('SELECT * FROM topics ORDER BY name').all();
  }
  res.json(rows);
});
