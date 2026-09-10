import { describe, it, expect } from 'vitest';
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
});
