import { Router } from 'express';
import { db } from '../db/db';

export const topicsRouter = Router();

topicsRouter.get('/', (req, res) => {
  const { grade } = req.query;
  if (grade !== undefined) {
    const gradeNum = Number(grade);
    if (![7, 8, 9].includes(gradeNum)) {
      return res.status(400).json({ error: 'INVALID_GRADE' });
    }
    const rows = db.prepare('SELECT * FROM topics WHERE grade = ? ORDER BY name').all(gradeNum);
    return res.json(rows);
  }
  const rows = db.prepare('SELECT * FROM topics ORDER BY name').all();
  return res.json(rows);
});
