import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret';

export async function hashPassword(pw: string): Promise<string> {
  return bcrypt.hash(pw, 10);
}

export async function verifyPassword(pw: string, hash: string): Promise<boolean> {
  return bcrypt.compare(pw, hash);
}

export function signJwt(payload: { id: number; username: string }): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '8h' });
}

export function verifyJwt(token: string): { id: number; username: string } | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { id: number; username: string };
    return { id: decoded.id, username: decoded.username };
  } catch {
    return null;
  }
}
