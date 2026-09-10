import { Router } from 'express';
import { db } from '../db/db';
import { authJwt } from '../middleware/authJwt';
import { validateBody } from '../middleware/validateBody';
import { validateQuestionData } from '../lib/schemas';
import { z } from 'zod';
import type { AuthedRequest } from '../middleware/authJwt';

export const adminRouter = Router();
adminRouter.use(authJwt);

const TopicSchema = z.object({
  name: z.string().min(1),
  grade: z.number().int().refine((g) => [7, 8, 9].includes(g)),
  description: z.string().optional(),
});

const QuestionSchema = z.object({
  topicId: z.number().int(),
  type: z.enum(['pg', 'tf', 'matching', 'ordering']),
  prompt: z.string().min(1),
  data: z.record(z.unknown()),
  difficulty: z.enum(['easy', 'medium', 'hard']).optional(),
  points: z.number().int().default(10),
});

// Topics CRUD
adminRouter.get('/topics', (_req, res) => {
  res.json(db.prepare('SELECT * FROM topics ORDER BY name').all());
});

adminRouter.post('/topics', validateBody(TopicSchema), (req, res) => {
  const r = db
    .prepare('INSERT INTO topics (name, grade, description) VALUES (?,?,?)')
    .run(req.body.name, req.body.grade, req.body.description || null);
  res.status(201).json({ id: r.lastInsertRowid });
});

adminRouter.put('/topics/:id', validateBody(TopicSchema), (req, res) => {
  db.prepare('UPDATE topics SET name=?, grade=?, description=? WHERE id=?').run(
    req.body.name,
    req.body.grade,
    req.body.description || null,
    Number(req.params.id)
  );
  res.json({ ok: true });
});

adminRouter.delete('/topics/:id', (req, res) => {
  db.prepare('DELETE FROM topics WHERE id=?').run(Number(req.params.id));
  res.json({ ok: true });
});

// Questions CRUD
adminRouter.get('/questions', (_req, res) => {
  const rows = db.prepare('SELECT * FROM questions ORDER BY id').all();
  res.json(rows.map((r: any) => ({ ...r, data: JSON.parse(r.data) })));
});

adminRouter.post('/questions', validateBody(QuestionSchema), (req: AuthedRequest, res, next) => {
  try {
    validateQuestionData(req.body.type, req.body.data);
    const r = db
      .prepare(
        'INSERT INTO questions (topic_id, type, prompt, data, difficulty, points, created_by) VALUES (?,?,?,?,?,?,?)'
      )
      .run(
        req.body.topicId,
        req.body.type,
        req.body.prompt,
        JSON.stringify(req.body.data),
        req.body.difficulty || null,
        req.body.points,
        req.user!.id
      );
    res.status(201).json({ id: r.lastInsertRowid });
  } catch (e) {
    next(e);
  }
});

adminRouter.put('/questions/:id', validateBody(QuestionSchema), (req: AuthedRequest, res, next) => {
  try {
    validateQuestionData(req.body.type, req.body.data);
    db.prepare(
      'UPDATE questions SET topic_id=?, type=?, prompt=?, data=?, difficulty=?, points=? WHERE id=?'
    ).run(
      req.body.topicId,
      req.body.type,
      req.body.prompt,
      JSON.stringify(req.body.data),
      req.body.difficulty || null,
      req.body.points,
      Number(req.params.id)
    );
    res.json({ ok: true });
  } catch (e) {
    next(e);
  }
});

adminRouter.delete('/questions/:id', (req, res) => {
  db.prepare('DELETE FROM questions WHERE id=?').run(Number(req.params.id));
  res.json({ ok: true });
});
