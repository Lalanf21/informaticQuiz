import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import request from 'supertest';
import express from 'express';
import { db } from '../src/db/db';
import { migrate } from '../src/db/migrate';
import { scoresRouter } from '../src/routes/scores';

const app = express();
app.use(express.json());
app.use('/api/scores', scoresRouter);

beforeEach(() => {
  migrate();
  db.exec('DELETE FROM scores; DELETE FROM quiz_sessions; DELETE FROM topics;');
  db.prepare('INSERT INTO topics (id, name, grade) VALUES (?, ?, ?)').run(1, 'Algoritma', 7);
  db.prepare('INSERT INTO topics (id, name, grade) VALUES (?, ?, ?)').run(2, 'Jaringan', 8);

  db.prepare('INSERT INTO quiz_sessions (id, student_name, grade, mode) VALUES (?,?,?,?)').run(
    's1',
    'Andi',
    7,
    'topic',
  );
  db.prepare('INSERT INTO quiz_sessions (id, student_name, grade, mode) VALUES (?,?,?,?)').run(
    's2',
    'Budi',
    7,
    'topic',
  );
  db.prepare('INSERT INTO quiz_sessions (id, student_name, grade, mode) VALUES (?,?,?,?)').run(
    's3',
    'Citra',
    8,
    'challenge',
  );

  db.prepare(
    'INSERT INTO scores (session_id, student_name, grade, topic_id, mode, total_points, max_points, percentage) VALUES (?,?,?,?,?,?,?,?)',
  ).run('s1', 'Andi', 7, 1, 'topic', 90, 100, 90);
  db.prepare(
    'INSERT INTO scores (session_id, student_name, grade, topic_id, mode, total_points, max_points, percentage) VALUES (?,?,?,?,?,?,?,?)',
  ).run('s2', 'Budi', 7, 1, 'topic', 70, 100, 70);
  db.prepare(
    'INSERT INTO scores (session_id, student_name, grade, topic_id, mode, total_points, max_points, percentage) VALUES (?,?,?,?,?,?,?,?)',
  ).run('s3', 'Citra', 8, null, 'challenge', 95, 100, 95);
});

afterEach(() => {
  db.exec('DELETE FROM scores; DELETE FROM quiz_sessions; DELETE FROM topics;');
});

describe('GET /api/scores/leaderboard', () => {
  it('returns sorted by total_points desc', async () => {
    const res = await request(app).get('/api/scores/leaderboard');
    expect(res.status).toBe(200);
    expect(res.body[0].student_name).toBe('Citra');
    expect(res.body[1].student_name).toBe('Andi');
    expect(res.body[2].student_name).toBe('Budi');
  });

  it('filters by mode', async () => {
    const res = await request(app).get('/api/scores/leaderboard?mode=topic');
    expect(res.status).toBe(200);
    expect(res.body.length).toBe(2);
    expect(res.body[0].student_name).toBe('Andi');
    expect(res.body[1].student_name).toBe('Budi');
  });

  it('filters by grade', async () => {
    const res = await request(app).get('/api/scores/leaderboard?grade=7');
    expect(res.status).toBe(200);
    expect(res.body.length).toBe(2);
    expect(res.body[0].student_name).toBe('Andi');
  });

  it('filters by topicId', async () => {
    const res = await request(app).get('/api/scores/leaderboard?topicId=1');
    expect(res.status).toBe(200);
    expect(res.body.length).toBe(2);
    expect(res.body[0].topic_id).toBe(1);
  });

  it('respects limit parameter', async () => {
    const res = await request(app).get('/api/scores/leaderboard?limit=1');
    expect(res.status).toBe(200);
    expect(res.body.length).toBe(1);
    expect(res.body[0].student_name).toBe('Citra');
  });

  it('falls back to default limit for 0, negative, or invalid limit', async () => {
    const resZero = await request(app).get('/api/scores/leaderboard?limit=0');
    expect(resZero.status).toBe(200);
    expect(resZero.body.length).toBe(3);

    const resNeg = await request(app).get('/api/scores/leaderboard?limit=-5');
    expect(resNeg.status).toBe(200);
    expect(resNeg.body.length).toBe(3);

    const resNan = await request(app).get('/api/scores/leaderboard?limit=abc');
    expect(resNan.status).toBe(200);
    expect(resNan.body.length).toBe(3);
  });

  it('works via mounted main app', async () => {
    const { app: mainApp } = await import('../src/index');
    const res = await request(mainApp).get('/api/scores/leaderboard');
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(3);
  });
});
