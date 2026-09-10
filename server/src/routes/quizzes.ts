import { Router } from 'express';
import { db } from '../db/db';
import type { Question } from '../types';

export const quizzesRouter = Router();

function stripKunci(q: Question): Record<string, unknown> {
  const d = (typeof q.data === 'string' ? JSON.parse(q.data) : q.data) as any;
  if (!d) return {};
  switch (q.type) {
    case 'pg':
      return { options: d.options ?? [] };
    case 'tf':
      return {};
    case 'matching': {
      const pairs = Array.isArray(d.pairs) ? d.pairs : [];
      const rights = pairs.map((p: any) => p.right).sort(() => Math.random() - 0.5);
      return { pairs: pairs.map((p: any) => p.left), rights };
    }
    case 'ordering': {
      const order = Array.isArray(d.correctOrder) ? d.correctOrder : [];
      return { items: [...order].sort(() => Math.random() - 0.5) };
    }
    default:
      return {};
  }
}

quizzesRouter.get('/topic/:topicId', (req, res, next) => {
  try {
    const rows = db.prepare('SELECT * FROM questions WHERE topic_id = ? ORDER BY RANDOM()').all(Number(req.params.topicId)) as Question[];
    const client = rows.map(q => ({
      id: q.id,
      type: q.type,
      prompt: q.prompt,
      payload: stripKunci({ ...q, data: typeof q.data === 'string' ? JSON.parse(q.data) : q.data }),
      points: q.points
    }));
    res.json(client);
  } catch (e) {
    next(e);
  }
});

quizzesRouter.get('/challenge', (req, res, next) => {
  try {
    const count = Math.min(Number(req.query.count) || 10, 20);
    const grade = Number(req.query.grade);
    const rows = db.prepare('SELECT q.* FROM questions q JOIN topics t ON q.topic_id = t.id WHERE t.grade = ? ORDER BY RANDOM() LIMIT ?').all(grade, count) as Question[];
    const client = rows.map(q => ({
      id: q.id,
      type: q.type,
      prompt: q.prompt,
      payload: stripKunci({ ...q, data: typeof q.data === 'string' ? JSON.parse(q.data) : q.data }),
      points: q.points
    }));
    res.json(client);
  } catch (e) {
    next(e);
  }
});

quizzesRouter.get('/campaign/:topicId/level/:n', (req, res, next) => {
  try {
    const diff = Number(req.params.n) === 1 ? 'easy' : Number(req.params.n) === 2 ? 'medium' : 'hard';
    const rows = db.prepare('SELECT * FROM questions WHERE topic_id = ? AND difficulty = ? ORDER BY RANDOM() LIMIT 10').all(Number(req.params.topicId), diff) as Question[];
    const client = rows.map(q => ({
      id: q.id,
      type: q.type,
      prompt: q.prompt,
      payload: stripKunci({ ...q, data: typeof q.data === 'string' ? JSON.parse(q.data) : q.data }),
      points: q.points
    }));
    res.json(client);
  } catch (e) {
    next(e);
  }
});
