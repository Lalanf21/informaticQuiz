import { describe, it, expect, vi } from 'vitest';
import express from 'express';
import request from 'supertest';
import { z } from 'zod';
import { authJwt, AuthedRequest } from '../src/middleware/authJwt';
import { errorHandler, ApiError } from '../src/middleware/errorHandler';
import { validateBody } from '../src/middleware/validateBody';
import { signJwt } from '../src/lib/auth';

describe('middleware', () => {
  describe('authJwt', () => {
    const app = express();
    app.get('/protected', authJwt, (req: AuthedRequest, res) => {
      res.json({ user: req.user });
    });
    app.use(errorHandler);

    it('returns 401 UNAUTHORIZED when Authorization header is missing', async () => {
      const res = await request(app).get('/protected');
      expect(res.status).toBe(401);
      expect(res.body).toEqual({ error: 'UNAUTHORIZED' });
    });

    it('returns 401 UNAUTHORIZED when Authorization header does not start with Bearer ', async () => {
      const res = await request(app)
        .get('/protected')
        .set('Authorization', 'Basic token123');
      expect(res.status).toBe(401);
      expect(res.body).toEqual({ error: 'UNAUTHORIZED' });
    });

    it('returns 401 INVALID_TOKEN when token is invalid', async () => {
      const res = await request(app)
        .get('/protected')
        .set('Authorization', 'Bearer invalid-token');
      expect(res.status).toBe(401);
      expect(res.body).toEqual({ error: 'INVALID_TOKEN' });
    });

    it('authenticates valid token and populates req.user', async () => {
      const token = signJwt({ id: 1, username: 'tester' });
      const res = await request(app)
        .get('/protected')
        .set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(200);
      expect(res.body).toEqual({ user: { id: 1, username: 'tester' } });
    });
  });

  describe('validateBody', () => {
    const testSchema = z.object({
      name: z.string().min(2),
      age: z.number().int().positive(),
    });

    const app = express();
    app.use(express.json());
    app.post('/validate', validateBody(testSchema), (req, res) => {
      res.json({ data: req.body });
    });
    app.use(errorHandler);

    it('passes valid request body to handler', async () => {
      const res = await request(app)
        .post('/validate')
        .send({ name: 'Alice', age: 30 });
      expect(res.status).toBe(200);
      expect(res.body).toEqual({ data: { name: 'Alice', age: 30 } });
    });

    it('routes validation errors to errorHandler as 400 VALIDATION_ERROR', async () => {
      const res = await request(app)
        .post('/validate')
        .send({ name: 'A', age: -1 });
      expect(res.status).toBe(400);
      expect(res.body.error).toBe('VALIDATION_ERROR');
      expect(Array.isArray(res.body.details)).toBe(true);
      expect(res.body.details.length).toBeGreaterThan(0);
    });
  });

  describe('errorHandler', () => {
    const app = express();
    app.use(express.json());

    app.get('/api-error', () => {
      throw new ApiError(404, 'NOT_FOUND', 'Resource missing');
    });

    app.get('/api-forbidden', () => {
      throw new ApiError(403, 'FORBIDDEN');
    });

    app.get('/unhandled-error', () => {
      throw new Error('Database crash');
    });

    app.use(errorHandler);

    it('formats ApiError with status and error code', async () => {
      const res = await request(app).get('/api-error');
      expect(res.status).toBe(404);
      expect(res.body).toEqual({ error: 'NOT_FOUND' });

      const resForbidden = await request(app).get('/api-forbidden');
      expect(resForbidden.status).toBe(403);
      expect(resForbidden.body).toEqual({ error: 'FORBIDDEN' });
    });

    it('catches unhandled errors and returns 500 INTERNAL_ERROR', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const res = await request(app).get('/unhandled-error');
      expect(res.status).toBe(500);
      expect(res.body).toEqual({ error: 'INTERNAL_ERROR' });
      expect(consoleSpy).toHaveBeenCalledWith('Unhandled error:', expect.any(Error));
      consoleSpy.mockRestore();
    });
  });
});
