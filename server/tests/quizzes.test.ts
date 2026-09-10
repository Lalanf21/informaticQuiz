import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import request from 'supertest';
import { app } from '../src/index';
import { db } from '../src/db/db';
import { migrate } from '../src/db/migrate';

beforeEach(() => {
  migrate();
  db.exec('DELETE FROM questions; DELETE FROM topics;');
  db.prepare('INSERT INTO topics (id, name, grade) VALUES (?, ?, ?)').run(1, 'Algoritma', 7);
  db.prepare('INSERT INTO topics (id, name, grade) VALUES (?, ?, ?)').run(2, 'Jaringan', 8);

  db.prepare('INSERT INTO questions (id, topic_id, type, prompt, data, difficulty, points) VALUES (?,?,?,?,?,?,?)')
    .run(1, 1, 'pg', '1+1?', '{"options":["1","2","3","4"],"correctIndex":1}', 'easy', 10);
  db.prepare('INSERT INTO questions (id, topic_id, type, prompt, data, difficulty, points) VALUES (?,?,?,?,?,?,?)')
    .run(2, 1, 'tf', 'HTTP aman?', '{"correctAnswer":true}', 'medium', 10);
  db.prepare('INSERT INTO questions (id, topic_id, type, prompt, data, difficulty, points) VALUES (?,?,?,?,?,?,?)')
    .run(3, 1, 'matching', 'Cocokkan protokol', '{"pairs":[{"left":"HTTP","right":"80"},{"left":"HTTPS","right":"443"}]}', 'hard', 10);
  db.prepare('INSERT INTO questions (id, topic_id, type, prompt, data, difficulty, points) VALUES (?,?,?,?,?,?,?)')
    .run(4, 1, 'ordering', 'Urutan boot', '{"correctOrder":["BIOS","POST","OS"]}', 'hard', 10);
  db.prepare('INSERT INTO questions (id, topic_id, type, prompt, data, difficulty, points) VALUES (?,?,?,?,?,?,?)')
    .run(5, 2, 'pg', 'IP?', '{"options":["v4","v6"],"correctIndex":0}', 'easy', 10);
});

afterEach(() => {
  db.exec('DELETE FROM questions; DELETE FROM topics;');
});

describe('GET /api/quizzes/topic/:topicId', () => {
  it('returns questions without kunci', async () => {
    const res = await request(app).get('/api/quizzes/topic/1');
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(4);

    const pgQ = res.body.find((q: any) => q.id === 1);
    expect(pgQ.payload.correctIndex).toBeUndefined();
    expect(pgQ.payload.options).toEqual(['1', '2', '3', '4']);

    const tfQ = res.body.find((q: any) => q.id === 2);
    expect(tfQ.payload.correctAnswer).toBeUndefined();
    expect(tfQ.payload).toEqual({});

    const matchQ = res.body.find((q: any) => q.id === 3);
    expect(matchQ.payload.pairs).toEqual(['HTTP', 'HTTPS']);
    expect(matchQ.payload.rights).toHaveLength(2);
    expect(matchQ.payload.rights).toContain('80');
    expect(matchQ.payload.rights).toContain('443');

    const orderQ = res.body.find((q: any) => q.id === 4);
    expect(orderQ.payload.correctOrder).toBeUndefined();
    expect(orderQ.payload.items).toHaveLength(3);
    expect(orderQ.payload.items).toContain('BIOS');
  });

  it('returns empty array when topic has no questions', async () => {
    const res = await request(app).get('/api/quizzes/topic/999');
    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });
});

describe('GET /api/quizzes/challenge', () => {
  it('returns questions filtered by grade and limited by count', async () => {
    const res = await request(app).get('/api/quizzes/challenge?grade=7&count=2');
    expect(res.status).toBe(200);
    expect(res.body.length).toBe(2);
    expect(res.body[0].payload.correctIndex).toBeUndefined();
  });

  it('clamps count to maximum 20', async () => {
    const res = await request(app).get('/api/quizzes/challenge?grade=7&count=50');
    expect(res.status).toBe(200);
    expect(res.body.length).toBeLessThanOrEqual(20);
  });
});

describe('GET /api/quizzes/campaign/:topicId/level/:n', () => {
  it('returns questions matching difficulty for level 1 (easy)', async () => {
    const res = await request(app).get('/api/quizzes/campaign/1/level/1');
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
    expect(res.body[0].id).toBe(1);
    expect(res.body[0].payload.correctIndex).toBeUndefined();
  });

  it('returns questions matching difficulty for level 2 (medium)', async () => {
    const res = await request(app).get('/api/quizzes/campaign/1/level/2');
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
    expect(res.body[0].id).toBe(2);
  });

  it('returns questions matching difficulty for level 3 (hard)', async () => {
    const res = await request(app).get('/api/quizzes/campaign/1/level/3');
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(2);
    expect(res.body.map((q: any) => q.id).sort()).toEqual([3, 4]);
  });
});
