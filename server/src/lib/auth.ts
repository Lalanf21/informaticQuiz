import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

function getJwtSecret(): string {
  if (process.env.NODE_ENV === 'production' && !process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET must be set in production');
  }
  return process.env.JWT_SECRET || 'dev-secret';
}

if (process.env.NODE_ENV === 'production' && !process.env.JWT_SECRET) {
  throw new Error('JWT_SECRET must be set in production');
}

export async function hashPassword(pw: string): Promise<string> {
  return bcrypt.hash(pw, 10);
}

export async function verifyPassword(pw: string, hash: string): Promise<boolean> {
  return bcrypt.compare(pw, hash);
}

export function signJwt(payload: { id: number; username: string }): string {
  return jwt.sign(payload, getJwtSecret(), { expiresIn: '8h' });
}

export function verifyJwt(token: string): { id: number; username: string } | null {
  const secret = getJwtSecret();
  try {
    const decoded = jwt.verify(token, secret);
    if (
      typeof decoded === 'object' &&
      decoded !== null &&
      typeof (decoded as any).id === 'number' &&
      typeof (decoded as any).username === 'string'
    ) {
      return { id: (decoded as any).id, username: (decoded as any).username };
    }
    return null;
  } catch {
    return null;
  }
}
