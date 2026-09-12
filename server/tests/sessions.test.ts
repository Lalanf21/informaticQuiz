import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import request from 'supertest';
import { app } from '../src/index';
import { db } from '../src/db/db';
import { migrate } from '../src/db/migrate';

beforeEach(() => {
  migrate();
  db.exec(
    'DELETE FROM session_answers; DELETE FROM session_questions; DELETE FROM scores; DELETE FROM quiz_sessions; DELETE FROM questions; DELETE FROM topics; DELETE FROM teachers;',
  );
  db.prepare('INSERT INTO topics (id, name, grade) VALUES (?, ?, ?)').run(1, 'Algoritma', 7);
  db.prepare('INSERT INTO topics (id, name, grade) VALUES (?, ?, ?)').run(2, 'Jaringan', 8);

  db.prepare(
    'INSERT INTO questions (id, topic_id, type, prompt, data, difficulty, points) VALUES (?,?,?,?,?,?,?)',
  ).run(1, 1, 'pg', '1+1?', '{"options":["1","2","3","4"],"correctIndex":1}', 'easy', 10);
  db.prepare(
    'INSERT INTO questions (id, topic_id, type, prompt, data, difficulty, points) VALUES (?,?,?,?,?,?,?)',
  ).run(2, 1, 'tf', 'HTTP aman?', '{"correctAnswer":true}', 'medium', 10);
  db.prepare(
    'INSERT INTO questions (id, topic_id, type, prompt, data, difficulty, points) VALUES (?,?,?,?,?,?,?)',
  ).run(
    3,
    1,
    'matching',
    'Cocokkan protokol',
    '{"pairs":[{"left":"HTTP","right":"80"},{"left":"HTTPS","right":"443"}]}',
    'hard',
    10,
  );
  db.prepare(
    'INSERT INTO questions (id, topic_id, type, prompt, data, difficulty, points) VALUES (?,?,?,?,?,?,?)',
  ).run(4, 1, 'ordering', 'Urutan boot', '{"correctOrder":["BIOS","POST","OS"]}', 'hard', 10);
  db.prepare(
    'INSERT INTO questions (id, topic_id, type, prompt, data, difficulty, points) VALUES (?,?,?,?,?,?,?)',
  ).run(5, 2, 'pg', 'IP?', '{"options":["v4","v6"],"correctIndex":0}', 'easy', 10);
  db.prepare(
    'INSERT INTO questions (id, topic_id, type, prompt, data, difficulty, points) VALUES (?,?,?,?,?,?,?)',
  ).run(6, 2, 'tf', 'UDP connectionless?', '{"correctAnswer":true}', 'medium', 10);
});

afterEach(() => {
  db.exec(
    'DELETE FROM session_answers; DELETE FROM session_questions; DELETE FROM scores; DELETE FROM quiz_sessions; DELETE FROM questions; DELETE FROM topics; DELETE FROM teachers;',
  );
});

describe('POST /api/sessions', () => {
  it('creates a topic session and returns sessionId', async () => {
    const res = await request(app)
      .post('/api/sessions')
      .send({ studentName: 'Andi', grade: 7, mode: 'topic', topicId: 1 });
    expect(res.status).toBe(201);
    expect(res.body.sessionId).toBeTruthy();
  });

  it('creates a challenge session with question limit', async () => {
    const res = await request(app)
      .post('/api/sessions')
      .send({ studentName: 'Budi', grade: 7, mode: 'challenge', count: 2 });
    expect(res.status).toBe(201);
    expect(res.body.sessionId).toBeTruthy();

    const qRes = await request(app).get(`/api/sessions/${res.body.sessionId}/questions`);
    expect(qRes.status).toBe(200);
    expect(qRes.body.length).toBe(2);
  });

  it('creates a campaign session matching level difficulty', async () => {
    const res = await request(app)
      .post('/api/sessions')
      .send({ studentName: 'Citra', grade: 7, mode: 'campaign', topicId: 1, level: 1 });
    expect(res.status).toBe(201);
    expect(res.body.sessionId).toBeTruthy();

    const qRes = await request(app).get(`/api/sessions/${res.body.sessionId}/questions`);
    expect(qRes.status).toBe(200);
    expect(qRes.body.length).toBe(1);
    expect(qRes.body[0].id).toBe(1);
  });

  it('rejects invalid grade', async () => {
    const res = await request(app)
      .post('/api/sessions')
      .send({ studentName: 'X', grade: 6, mode: 'topic', topicId: 1 });
    expect(res.status).toBe(400);
    expect(res.body.error).toBe('INVALID_INPUT');
  });

  it('rejects invalid mode or missing studentName', async () => {
    const res1 = await request(app)
      .post('/api/sessions')
      .send({ studentName: '', grade: 7, mode: 'topic', topicId: 1 });
    expect(res1.status).toBe(400);

    const res2 = await request(app)
      .post('/api/sessions')
      .send({ studentName: 'Andi', grade: 7, mode: 'unknown', topicId: 1 });
    expect(res2.status).toBe(400);
  });

  it('returns 404 when no questions match', async () => {
    const res = await request(app)
      .post('/api/sessions')
      .send({ studentName: 'Andi', grade: 7, mode: 'topic', topicId: 999 });
    expect(res.status).toBe(404);
    expect(res.body.error).toBe('NO_QUESTIONS');
  });
});

describe('GET /api/sessions/:id/questions', () => {
  it('returns questions without kunci', async () => {
    const created = await request(app)
      .post('/api/sessions')
      .send({ studentName: 'Andi', grade: 7, mode: 'topic', topicId: 1 });
    const res = await request(app).get(`/api/sessions/${created.body.sessionId}/questions`);
    expect(res.status).toBe(200);
    expect(res.body.length).toBe(4);

    const pg = res.body.find((q: any) => q.type === 'pg');
    expect(pg.payload.options).toEqual(['1', '2', '3', '4']);
    expect(pg.payload.correctIndex).toBeUndefined();

    const tf = res.body.find((q: any) => q.type === 'tf');
    expect(tf.payload.correctAnswer).toBeUndefined();
    expect(tf.payload).toEqual({});

    const matching = res.body.find((q: any) => q.type === 'matching');
    expect(matching.payload.pairs).toEqual(['HTTP', 'HTTPS']);
    expect(matching.payload.rights).toHaveLength(2);
    expect(matching.payload.rights).toContain('80');
    expect(matching.payload.rights).toContain('443');

    const ordering = res.body.find((q: any) => q.type === 'ordering');
    expect(ordering.payload.items).toHaveLength(3);
    expect(ordering.payload.correctOrder).toBeUndefined();
  });

  it('returns 404 for non-existent session', async () => {
    const res = await request(app).get('/api/sessions/non-existent-id/questions');
    expect(res.status).toBe(404);
    expect(res.body.error).toBe('SESSION_NOT_FOUND');
  });
});

describe('POST /api/sessions/:id/submit', () => {
  it('scores a correct submission', async () => {
    const created = await request(app)
      .post('/api/sessions')
      .send({ studentName: 'Andi', grade: 8, mode: 'topic', topicId: 2 });
    const qs = await request(app).get(`/api/sessions/${created.body.sessionId}/questions`);
    const pg = qs.body.find((q: any) => q.type === 'pg');
    const tf = qs.body.find((q: any) => q.type === 'tf');
    const res = await request(app)
      .post(`/api/sessions/${created.body.sessionId}/submit`)
      .send({
        answers: [
          { questionId: pg.id, answer: { index: 0 } },
          { questionId: tf.id, answer: { value: true } },
        ],
      });
    expect(res.status).toBe(201);
    expect(res.body.totalPoints).toBe(20);
    expect(res.body.maxPoints).toBe(20);
    expect(res.body.percentage).toBe(100);
    expect(res.body.breakdown).toHaveLength(2);
    expect(res.body.scoreId).toBeTruthy();
  });

  it('handles partial correct answers and scoring', async () => {
    const created = await request(app)
      .post('/api/sessions')
      .send({ studentName: 'Andi', grade: 8, mode: 'topic', topicId: 2 });
    const qs = await request(app).get(`/api/sessions/${created.body.sessionId}/questions`);
    const pg = qs.body.find((q: any) => q.type === 'pg');
    const tf = qs.body.find((q: any) => q.type === 'tf');
    const res = await request(app)
      .post(`/api/sessions/${created.body.sessionId}/submit`)
      .send({
        answers: [
          { questionId: pg.id, answer: { index: 0 } }, // correct
          { questionId: tf.id, answer: { value: false } }, // wrong
        ],
      });
    expect(res.status).toBe(201);
    expect(res.body.totalPoints).toBe(10);
    expect(res.body.maxPoints).toBe(20);
    expect(res.body.percentage).toBe(50);
  });

  it('calculates maxPoints from full session on partial submission (skipping questions)', async () => {
    const created = await request(app)
      .post('/api/sessions')
      .send({ studentName: 'Andi', grade: 8, mode: 'topic', topicId: 2 });
    const qs = await request(app).get(`/api/sessions/${created.body.sessionId}/questions`);
    const pg = qs.body.find((q: any) => q.type === 'pg');

    // Submit only 1 answer out of 2 assigned questions
    const res = await request(app)
      .post(`/api/sessions/${created.body.sessionId}/submit`)
      .send({
        answers: [{ questionId: pg.id, answer: { index: 0 } }],
      });
    expect(res.status).toBe(201);
    expect(res.body.totalPoints).toBe(10);
    expect(res.body.maxPoints).toBe(20);
    expect(res.body.percentage).toBe(50); // 10/20 = 50%, NOT 10/10 = 100%
  });

  it('ignores duplicate question answers in submission payload', async () => {
    const created = await request(app)
      .post('/api/sessions')
      .send({ studentName: 'Andi', grade: 8, mode: 'topic', topicId: 2 });
    const qs = await request(app).get(`/api/sessions/${created.body.sessionId}/questions`);
    const pg = qs.body.find((q: any) => q.type === 'pg');

    // Duplicate question answer for the same questionId
    const res = await request(app)
      .post(`/api/sessions/${created.body.sessionId}/submit`)
      .send({
        answers: [
          { questionId: pg.id, answer: { index: 0 } },
          { questionId: pg.id, answer: { index: 0 } },
        ],
      });
    expect(res.status).toBe(201);
    expect(res.body.totalPoints).toBe(10); // awarded once
    expect(res.body.maxPoints).toBe(20);
    expect(res.body.percentage).toBe(50);
    expect(res.body.breakdown).toHaveLength(1);
  });

  it('rejects double submit with 409', async () => {
    const created = await request(app)
      .post('/api/sessions')
      .send({ studentName: 'Andi', grade: 7, mode: 'topic', topicId: 1 });
    await request(app).post(`/api/sessions/${created.body.sessionId}/submit`).send({ answers: [] });
    const res = await request(app)
      .post(`/api/sessions/${created.body.sessionId}/submit`)
      .send({ answers: [] });
    expect(res.status).toBe(409);
    expect(res.body.error).toBe('ALREADY_SUBMITTED');
  });

  it('returns 404 when submitting non-existent session', async () => {
    const res = await request(app).post('/api/sessions/unknown-id/submit').send({ answers: [] });
    expect(res.status).toBe(404);
    expect(res.body.error).toBe('SESSION_NOT_FOUND');
  });
});

describe('GET /api/sessions/:id/result', () => {
  it('returns 404 for non-existent session', async () => {
    const res = await request(app).get('/api/sessions/non-existent-id/result');
    expect(res.status).toBe(404);
    expect(res.body.error).toBe('SESSION_NOT_FOUND');
  });

  it('returns 409 when session has not been submitted', async () => {
    const created = await request(app)
      .post('/api/sessions')
      .send({ studentName: 'Andi', grade: 7, mode: 'topic', topicId: 1 });
    const res = await request(app).get(`/api/sessions/${created.body.sessionId}/result`);
    expect(res.status).toBe(409);
    expect(res.body.error).toBe('NOT_SUBMITTED');
  });

  it('returns result with score, answers, level, and topicId (pre-flight ruling)', async () => {
    const created = await request(app).post('/api/sessions').send({
      studentName: 'Andi',
      grade: 7,
      mode: 'campaign',
      topicId: 1,
      level: 1,
    });
    const qs = await request(app).get(`/api/sessions/${created.body.sessionId}/questions`);
    const q1 = qs.body[0];

    await request(app)
      .post(`/api/sessions/${created.body.sessionId}/submit`)
      .send({
        answers: [{ questionId: q1.id, answer: { index: 1 } }],
      });

    const res = await request(app).get(`/api/sessions/${created.body.sessionId}/result`);
    expect(res.status).toBe(200);
    expect(res.body.score).toBeTruthy();
    expect(res.body.score.percentage).toBe(100);
    expect(res.body.answers).toHaveLength(1);
    expect(res.body.answers[0].question_id).toBe(q1.id);
    expect(res.body.answers[0].is_correct).toBe(1);
    expect(res.body.answers[0].prompt).toBe(q1.prompt);
    // Pre-flight ruling assertion:
    expect(res.body.level).toBe(1);
    expect(res.body.topicId).toBe(1);
  });
});
