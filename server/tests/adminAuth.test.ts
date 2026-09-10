import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import request from 'supertest';
import express from 'express';
import { db } from '../src/db/db';
import { migrate } from '../src/db/migrate';
import { adminAuthRouter } from '../src/routes/adminAuth';
import { errorHandler } from '../src/middleware/errorHandler';
import { app as mainApp } from '../src/index';

process.env.REGISTRATION_KEY = 'test-key';

const app = express();
app.use(express.json());
app.use('/api/admin', adminAuthRouter);
app.use(errorHandler);

beforeEach(() => {
  migrate();
  db.exec('DELETE FROM teachers;');
});

afterEach(() => {
  db.exec('DELETE FROM teachers;');
});

describe('POST /api/admin/register', () => {
  it('registers a teacher with correct key', async () => {
    const res = await request(app)
      .post('/api/admin/register')
      .send({ username: 'guru1', password: 'pass123', name: 'Pak Guru', registrationKey: 'test-key' });
    expect(res.status).toBe(201);
    expect(res.body.token).toBeTruthy();
    expect(res.body.teacher).toMatchObject({
      username: 'guru1',
      name: 'Pak Guru',
    });
    expect(res.body.teacher.id).toBeTypeOf('number');
  });

  it('rejects wrong registration key', async () => {
    const res = await request(app)
      .post('/api/admin/register')
      .send({ username: 'guru1', password: 'pass123', registrationKey: 'wrong' });
    expect(res.status).toBe(403);
    expect(res.body.error).toBe('INVALID_REGISTRATION_KEY');
  });

  it('rejects registration when REGISTRATION_KEY is not configured', async () => {
    const saved = process.env.REGISTRATION_KEY;
    delete process.env.REGISTRATION_KEY;
    try {
      const res = await request(app)
        .post('/api/admin/register')
        .send({ username: 'guru1', password: 'pass123', registrationKey: 'test-key' });
      expect(res.status).toBe(403);
      expect(res.body.error).toBe('INVALID_REGISTRATION_KEY');
    } finally {
      process.env.REGISTRATION_KEY = saved;
    }
  });

  it('rejects duplicate username', async () => {
    await request(app)
      .post('/api/admin/register')
      .send({ username: 'guru1', password: 'pass123', registrationKey: 'test-key' });
    const res = await request(app)
      .post('/api/admin/register')
      .send({ username: 'guru1', password: 'pass123', registrationKey: 'test-key' });
    expect(res.status).toBe(409);
    expect(res.body.error).toBe('USERNAME_TAKEN');
  });

  it('rejects invalid body (short username / short password)', async () => {
    const resShortUser = await request(app)
      .post('/api/admin/register')
      .send({ username: 'ab', password: 'pass123', registrationKey: 'test-key' });
    expect(resShortUser.status).toBe(400);

    const resShortPass = await request(app)
      .post('/api/admin/register')
      .send({ username: 'guru1', password: '123', registrationKey: 'test-key' });
    expect(resShortPass.status).toBe(400);
  });
});

describe('POST /api/admin/login', () => {
  it('logs in a registered teacher', async () => {
    await request(app)
      .post('/api/admin/register')
      .send({ username: 'guru1', password: 'pass123', name: 'Pak Guru', registrationKey: 'test-key' });
    const res = await request(app)
      .post('/api/admin/login')
      .send({ username: 'guru1', password: 'pass123' });
    expect(res.status).toBe(200);
    expect(res.body.token).toBeTruthy();
    expect(res.body.teacher).toMatchObject({
      username: 'guru1',
      name: 'Pak Guru',
    });
    expect(res.body.teacher.id).toBeTypeOf('number');
  });

  it('rejects wrong password', async () => {
    await request(app)
      .post('/api/admin/register')
      .send({ username: 'guru1', password: 'pass123', registrationKey: 'test-key' });
    const res = await request(app)
      .post('/api/admin/login')
      .send({ username: 'guru1', password: 'wrong' });
    expect(res.status).toBe(401);
    expect(res.body.error).toBe('INVALID_CREDENTIALS');
  });

  it('rejects non-existent teacher', async () => {
    const res = await request(app)
      .post('/api/admin/login')
      .send({ username: 'unknown', password: 'password123' });
    expect(res.status).toBe(401);
    expect(res.body.error).toBe('INVALID_CREDENTIALS');
  });

  it('rejects login with invalid payload', async () => {
    const res = await request(app)
      .post('/api/admin/login')
      .send({ username: 'guru1' });
    expect(res.status).toBe(400);
  });

  it('works via main app wiring /api/admin', async () => {
    const regRes = await request(mainApp)
      .post('/api/admin/register')
      .send({ username: 'mainadmin', password: 'pass123', registrationKey: 'test-key' });
    expect(regRes.status).toBe(201);

    const loginRes = await request(mainApp)
      .post('/api/admin/login')
      .send({ username: 'mainadmin', password: 'pass123' });
    expect(loginRes.status).toBe(200);
    expect(loginRes.body.token).toBeTruthy();
    expect(loginRes.body.teacher.username).toBe('mainadmin');
  });
});
