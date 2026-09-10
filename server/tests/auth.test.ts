import { describe, it, expect } from 'vitest';
import jwt from 'jsonwebtoken';
import { hashPassword, verifyPassword, signJwt, verifyJwt } from '../src/lib/auth';

describe('auth lib', () => {
  it('hashes and verifies password', async () => {
    const hash = await hashPassword('secret123');
    expect(hash).not.toBe('secret123');
    expect(await verifyPassword('secret123', hash)).toBe(true);
    expect(await verifyPassword('wrong', hash)).toBe(false);
  });

  it('signs and verifies jwt', () => {
    const token = signJwt({ id: 5, username: 'guru' });
    const payload = verifyJwt(token);
    expect(payload).toEqual({ id: 5, username: 'guru' });
  });

  it('rejects invalid jwt', () => {
    expect(verifyJwt('invalid.token.here')).toBeNull();
  });

  it('rejects token with non-object or invalid payload fields', () => {
    const secret = process.env.JWT_SECRET || 'dev-secret';
    const stringToken = jwt.sign('plain-string', secret);
    expect(verifyJwt(stringToken)).toBeNull();

    const missingUsernameToken = jwt.sign({ id: 1 }, secret);
    expect(verifyJwt(missingUsernameToken)).toBeNull();

    const stringIdToken = jwt.sign({ id: '123', username: 'guru' }, secret);
    expect(verifyJwt(stringIdToken)).toBeNull();
  });

  it('throws in production when JWT_SECRET is not set', () => {
    const origEnv = process.env.NODE_ENV;
    const origSecret = process.env.JWT_SECRET;
    try {
      process.env.NODE_ENV = 'production';
      delete process.env.JWT_SECRET;
      expect(() => signJwt({ id: 1, username: 'admin' })).toThrow(/JWT_SECRET/);
      expect(() => verifyJwt('any-token')).toThrow(/JWT_SECRET/);
    } finally {
      process.env.NODE_ENV = origEnv;
      process.env.JWT_SECRET = origSecret;
    }
  });
});
