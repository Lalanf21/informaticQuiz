import { Router } from 'express';
import { db } from '../db/db';

export const scoresRouter = Router();

scoresRouter.get('/leaderboard', (req, res) => {
  const limit = Math.min(Number(req.query.limit) || 50, 200);
  let sql = 'SELECT * FROM scores WHERE 1=1';
  const params: any[] = [];
  if (req.query.mode) { sql += ' AND mode = ?'; params.push(req.query.mode); }
  if (req.query.grade) { sql += ' AND grade = ?'; params.push(Number(req.query.grade)); }
  if (req.query.topicId) { sql += ' AND topic_id = ?'; params.push(Number(req.query.topicId)); }
  sql += ' ORDER BY total_points DESC LIMIT ?';
  params.push(limit);
  const rows = db.prepare(sql).all(...params);
  res.json(rows);
});
