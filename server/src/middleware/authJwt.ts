import type { Request, Response, NextFunction } from 'express';
import { verifyJwt } from '../lib/auth';

export interface AuthedRequest extends Request {
  user?: { id: number; username: string };
}

export function authJwt(req: AuthedRequest, res: Response, next: NextFunction): void {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    res.status(401).json({ error: 'UNAUTHORIZED' });
    return;
  }
  const token = header.slice(7);
  const payload = verifyJwt(token);
  if (!payload) {
    res.status(401).json({ error: 'INVALID_TOKEN' });
    return;
  }
  req.user = payload;
  next();
}
