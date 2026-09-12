import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import request from 'supertest';
import { app } from '../src/index';
import { db } from '../src/db/db';

beforeEach(() => {
  db.exec('DELETE FROM topics;');
});

afterEach(() => {
  db.exec('DELETE FROM topics;');
});

describe('GET /api/topics', () => {
  it('returns empty list when no topics', async () => {
    const res = await request(app).get('/api/topics');
    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });

  it('returns all topics ordered by name', async () => {
    db.prepare('INSERT INTO topics (name, grade, description) VALUES (?, ?, ?)').run(
      'Zebra Topic',
      7,
      'Desc 1',
    );
    db.prepare('INSERT INTO topics (name, grade, description) VALUES (?, ?, ?)').run(
      'Alpha Topic',
      8,
      'Desc 2',
    );
    db.prepare('INSERT INTO topics (name, grade, description) VALUES (?, ?, ?)').run(
      'Beta Topic',
      7,
      'Desc 3',
    );

    const res = await request(app).get('/api/topics');
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(3);
    expect(res.body.map((t: { name: string }) => t.name)).toEqual([
      'Alpha Topic',
      'Beta Topic',
      'Zebra Topic',
    ]);
  });

  it('filters topics by grade query param', async () => {
    db.prepare('INSERT INTO topics (name, grade) VALUES (?, ?)').run('Perangkat Keras', 7);
    db.prepare('INSERT INTO topics (name, grade) VALUES (?, ?)').run('Algoritma', 8);
    db.prepare('INSERT INTO topics (name, grade) VALUES (?, ?)').run('Jaringan Komputer', 7);

    const res = await request(app).get('/api/topics?grade=7');
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(2);
    expect(res.body.map((t: { name: string }) => t.name)).toEqual([
      'Jaringan Komputer',
      'Perangkat Keras',
    ]);
    expect(res.body.every((t: { grade: number }) => t.grade === 7)).toBe(true);
  });

  it('returns empty list when no topics match grade filter', async () => {
    db.prepare('INSERT INTO topics (name, grade) VALUES (?, ?)').run('Perangkat Keras', 7);

    const res = await request(app).get('/api/topics?grade=9');
    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });

  it('returns 400 INVALID_GRADE when grade query param is invalid', async () => {
    const resUnder = await request(app).get('/api/topics?grade=6');
    expect(resUnder.status).toBe(400);
    expect(resUnder.body).toEqual({ error: 'INVALID_GRADE' });

    const resOver = await request(app).get('/api/topics?grade=10');
    expect(resOver.status).toBe(400);
    expect(resOver.body).toEqual({ error: 'INVALID_GRADE' });

    const resNaN = await request(app).get('/api/topics?grade=invalid');
    expect(resNaN.status).toBe(400);
    expect(resNaN.body).toEqual({ error: 'INVALID_GRADE' });
  });

  it('includes security and CORS headers from middleware bootstrap', async () => {
    const res = await request(app).get('/api/topics').set('Origin', 'http://localhost:5173');
    expect(res.status).toBe(200);
    expect(res.headers['access-control-allow-origin']).toBe('http://localhost:5173');
    expect(res.headers['x-content-type-options']).toBe('nosniff');
  });
});
