import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import request from 'supertest';
import express from 'express';
import { db } from '../src/db/db';
import { migrate } from '../src/db/migrate';
import { adminAuthRouter } from '../src/routes/adminAuth';
import { adminRouter } from '../src/routes/admin';
import { errorHandler } from '../src/middleware/errorHandler';
import { app as mainApp } from '../src/index';

process.env.REGISTRATION_KEY = 'test-key';

const app = express();
app.use(express.json());
app.use('/api/admin', adminAuthRouter);
app.use('/api/admin', adminRouter);
app.use(errorHandler);

let token: string;
let topicId: number;

beforeEach(async () => {
  migrate();
  db.exec(
    'DELETE FROM session_answers; DELETE FROM session_questions; DELETE FROM scores; DELETE FROM quiz_sessions; DELETE FROM questions; DELETE FROM topics; DELETE FROM teachers;',
  );
  const r = await request(app)
    .post('/api/admin/register')
    .send({ username: 'guru', password: 'pass123', registrationKey: 'test-key' });
  token = r.body.token;

  const topicInsert = db
    .prepare('INSERT INTO topics (name, grade, description) VALUES (?,?,?)')
    .run('Algoritma', 7, 'Dasar Algoritma');
  topicId = Number(topicInsert.lastInsertRowid);
});

afterEach(() => {
  db.exec(
    'DELETE FROM session_answers; DELETE FROM session_questions; DELETE FROM scores; DELETE FROM quiz_sessions; DELETE FROM questions; DELETE FROM topics; DELETE FROM teachers;',
  );
});

describe('POST /api/admin/questions (auth required)', () => {
  it('rejects without token', async () => {
    const res = await request(app)
      .post('/api/admin/questions')
      .send({ topicId, type: 'pg', prompt: 'p', data: { options: ['a', 'b'], correctIndex: 0 } });
    expect(res.status).toBe(401);
  });

  it('creates a question with valid data', async () => {
    const res = await request(app)
      .post('/api/admin/questions')
      .set('Authorization', `Bearer ${token}`)
      .send({
        topicId,
        type: 'pg',
        prompt: '1+1?',
        data: { options: ['1', '2', '3', '4'], correctIndex: 1 },
        difficulty: 'easy',
        points: 10,
      });
    expect(res.status).toBe(201);
    expect(res.body.id).toBeTruthy();
  });

  it('rejects invalid question data (zod)', async () => {
    const res = await request(app)
      .post('/api/admin/questions')
      .set('Authorization', `Bearer ${token}`)
      .send({
        topicId,
        type: 'pg',
        prompt: 'p',
        data: { options: ['a'], correctIndex: 0 },
      });
    expect(res.status).toBe(400);
  });
});

describe('CRUD topics', () => {
  it('lists topics', async () => {
    const res = await request(app).get('/api/admin/topics').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.length).toBe(1);
    expect(res.body[0].name).toBe('Algoritma');
    expect(res.body[0].grade).toBe(7);
  });

  it('rejects list topics without token', async () => {
    const res = await request(app).get('/api/admin/topics');
    expect(res.status).toBe(401);
  });

  it('creates topic with valid data', async () => {
    const res = await request(app)
      .post('/api/admin/topics')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Jaringan Komputer', grade: 8, description: 'Materi Jaringan' });
    expect(res.status).toBe(201);
    expect(res.body.id).toBeTruthy();

    const created = db.prepare('SELECT * FROM topics WHERE id = ?').get(res.body.id) as any;
    expect(created.name).toBe('Jaringan Komputer');
    expect(created.grade).toBe(8);
  });

  it('rejects creating topic with invalid grade', async () => {
    const res = await request(app)
      .post('/api/admin/topics')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Invalid Grade', grade: 6 });
    expect(res.status).toBe(400);
  });

  it('updates topic', async () => {
    const res = await request(app)
      .put(`/api/admin/topics/${topicId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Algoritma Lanjutan', grade: 9, description: 'Update desc' });
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);

    const updated = db.prepare('SELECT * FROM topics WHERE id = ?').get(topicId) as any;
    expect(updated.name).toBe('Algoritma Lanjutan');
    expect(updated.grade).toBe(9);
  });

  it('deletes topic', async () => {
    const res = await request(app)
      .delete(`/api/admin/topics/${topicId}`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);

    const deleted = db.prepare('SELECT * FROM topics WHERE id = ?').get(topicId);
    expect(deleted).toBeUndefined();
  });

  it('returns 404 when updating non-existent topic', async () => {
    const res = await request(app)
      .put('/api/admin/topics/99999')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Ghost Topic', grade: 7 });
    expect(res.status).toBe(404);
    expect(res.body.error).toBe('NOT_FOUND');
  });

  it('returns 404 when deleting non-existent topic', async () => {
    const res = await request(app)
      .delete('/api/admin/topics/99999')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(404);
    expect(res.body.error).toBe('NOT_FOUND');
  });

  it('returns 409 TOPIC_IN_USE when deleting a topic referenced by active sessions or scores', async () => {
    db.prepare(
      'INSERT INTO quiz_sessions (id, student_name, grade, mode, topic_id) VALUES (?,?,?,?,?)',
    ).run('session-active', 'Budi', 7, 'topic', topicId);

    const res = await request(app)
      .delete(`/api/admin/topics/${topicId}`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(409);
    expect(res.body.error).toBe('TOPIC_IN_USE');
  });
});

describe('CRUD questions', () => {
  it('lists questions with parsed json data', async () => {
    const insert = await request(app)
      .post('/api/admin/questions')
      .set('Authorization', `Bearer ${token}`)
      .send({
        topicId,
        type: 'tf',
        prompt: 'RAM is volatile',
        data: { correctAnswer: true },
        difficulty: 'medium',
        points: 15,
      });
    expect(insert.status).toBe(201);

    const res = await request(app)
      .get('/api/admin/questions')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.length).toBe(1);
    expect(res.body[0].prompt).toBe('RAM is volatile');
    expect(res.body[0].data).toEqual({ correctAnswer: true });
    expect(res.body[0].points).toBe(15);
  });

  it('updates question', async () => {
    const insert = await request(app)
      .post('/api/admin/questions')
      .set('Authorization', `Bearer ${token}`)
      .send({
        topicId,
        type: 'ordering',
        prompt: 'Order steps',
        data: { correctOrder: ['input', 'process', 'output'] },
      });
    const questionId = insert.body.id;

    const res = await request(app)
      .put(`/api/admin/questions/${questionId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        topicId,
        type: 'ordering',
        prompt: 'Order steps updated',
        data: { correctOrder: ['step 1', 'step 2'] },
        difficulty: 'hard',
        points: 20,
      });
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);

    const updated = db.prepare('SELECT * FROM questions WHERE id = ?').get(questionId) as any;
    expect(updated.prompt).toBe('Order steps updated');
    expect(JSON.parse(updated.data)).toEqual({ correctOrder: ['step 1', 'step 2'] });
    expect(updated.difficulty).toBe('hard');
    expect(updated.points).toBe(20);
  });

  it('rejects question update with invalid data', async () => {
    const insert = await request(app)
      .post('/api/admin/questions')
      .set('Authorization', `Bearer ${token}`)
      .send({
        topicId,
        type: 'tf',
        prompt: 'CPU is core',
        data: { correctAnswer: false },
      });
    const questionId = insert.body.id;

    const res = await request(app)
      .put(`/api/admin/questions/${questionId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        topicId,
        type: 'tf',
        prompt: 'CPU is core',
        data: { correctAnswer: 'not-a-boolean' },
      });
    expect(res.status).toBe(400);
  });

  it('deletes question', async () => {
    const insert = await request(app)
      .post('/api/admin/questions')
      .set('Authorization', `Bearer ${token}`)
      .send({
        topicId,
        type: 'matching',
        prompt: 'Match items',
        data: {
          pairs: [
            { left: 'CPU', right: 'Processor' },
            { left: 'RAM', right: 'Memory' },
          ],
        },
      });
    const questionId = insert.body.id;

    const res = await request(app)
      .delete(`/api/admin/questions/${questionId}`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);

    const deleted = db.prepare('SELECT * FROM questions WHERE id = ?').get(questionId);
    expect(deleted).toBeUndefined();
  });

  it('returns 404 when updating non-existent question', async () => {
    const res = await request(app)
      .put('/api/admin/questions/99999')
      .set('Authorization', `Bearer ${token}`)
      .send({
        topicId,
        type: 'tf',
        prompt: 'Ghost question',
        data: { correctAnswer: true },
      });
    expect(res.status).toBe(404);
    expect(res.body.error).toBe('NOT_FOUND');
  });

  it('returns 404 when deleting non-existent question', async () => {
    const res = await request(app)
      .delete('/api/admin/questions/99999')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(404);
    expect(res.body.error).toBe('NOT_FOUND');
  });
});

describe('Main app route wiring', () => {
  it('serves admin routes via mainApp', async () => {
    const res = await request(mainApp)
      .get('/api/admin/topics')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.length).toBe(1);
  });
});
