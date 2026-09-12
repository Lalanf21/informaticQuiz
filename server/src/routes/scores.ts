import { Router } from 'express';
import { db } from '../db/db';

export const scoresRouter = Router();

scoresRouter.get('/leaderboard', (req, res, next) => {
  try {
    const rawLimit = Number(req.query.limit);
    const limit = Number.isInteger(rawLimit) && rawLimit > 0 ? Math.min(rawLimit, 200) : 50;
    let sql = 'SELECT * FROM scores WHERE 1=1';
    const params: any[] = [];
    if (req.query.mode) {
      sql += ' AND mode = ?';
      params.push(req.query.mode);
    }
    if (req.query.grade) {
      sql += ' AND grade = ?';
      params.push(Number(req.query.grade));
    }
    if (req.query.topicId) {
      sql += ' AND topic_id = ?';
      params.push(Number(req.query.topicId));
    }
    sql += ' ORDER BY total_points DESC LIMIT ?';
    params.push(limit);
    const rows = db.prepare(sql).all(...params);
    res.json(rows);
  } catch (e) {
    next(e);
  }
});
