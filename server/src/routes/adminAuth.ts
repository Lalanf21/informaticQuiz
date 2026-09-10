import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import bcrypt from 'bcrypt';
import { db } from '../db/db';
import { signJwt } from '../lib/auth';
import { validateBody } from '../middleware/validateBody';
import { ApiError } from '../middleware/errorHandler';
import { z } from 'zod';

export const adminAuthRouter = Router();

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  skip: () => process.env.NODE_ENV === 'test',
});

const RegisterSchema = z.object({
  username: z.string().min(3),
  password: z.string().min(6),
  name: z.string().optional(),
  registrationKey: z.string(),
});

const LoginSchema = z.object({
  username: z.string(),
  password: z.string(),
});

adminAuthRouter.post('/register', validateBody(RegisterSchema), async (req, res, next) => {
  try {
    if (req.body.registrationKey !== process.env.REGISTRATION_KEY) {
      throw new ApiError(403, 'INVALID_REGISTRATION_KEY');
    }
    const hash = await bcrypt.hash(req.body.password, 10);
    const result = db.prepare('INSERT INTO teachers (username, password_hash, name) VALUES (?,?,?)').run(
      req.body.username,
      hash,
      req.body.name || null
    );
    const token = signJwt({ id: Number(result.lastInsertRowid), username: req.body.username });
    res.status(201).json({ token });
  } catch (e) {
    if (e instanceof Error && e.message.includes('UNIQUE')) {
      next(new ApiError(409, 'USERNAME_TAKEN'));
      return;
    }
    next(e);
  }
});

adminAuthRouter.post('/login', loginLimiter, validateBody(LoginSchema), async (req, res, next) => {
  try {
    const teacher = db.prepare('SELECT * FROM teachers WHERE username = ?').get(req.body.username) as
      | { id: number; username: string; password_hash: string; name: string | null }
      | undefined;
    if (!teacher) throw new ApiError(401, 'INVALID_CREDENTIALS');
    const ok = await bcrypt.compare(req.body.password, teacher.password_hash);
    if (!ok) throw new ApiError(401, 'INVALID_CREDENTIALS');
    const token = signJwt({ id: teacher.id, username: teacher.username });
    res.json({ token, teacher: { id: teacher.id, username: teacher.username, name: teacher.name } });
  } catch (e) {
    next(e);
  }
});
